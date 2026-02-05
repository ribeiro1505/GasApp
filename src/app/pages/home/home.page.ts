import {Component, OnInit, ViewChild, AfterViewChecked} from '@angular/core';

declare const L: any;
import {GasService} from 'src/app/services/gas.service';
import {Geolocation} from '@capacitor/geolocation';
import {Preferences} from '@capacitor/preferences';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  GasStationCardSmallComponent
} from '../../components/gas-station-card-small/gas-station-card-small.component';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonRange,
  IonRefresher,
  IonRefresherContent,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar
} from "@ionic/angular/standalone";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    GasStationCardSmallComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonIcon,
    IonButtons,
    IonButton,
    IonContent,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonSelect,
    IonSelectOption,
    IonRange
  ]
})
export class HomePage implements OnInit, AfterViewChecked {
  @ViewChild('fuelSelect') fuelSelect!: IonSelect;

  MAX_DISTANCE = 10;
  MAX_NUMBER_RESULTS = 20;

  // Map
  private map: any;
  private mapInitialized = false;

  loaded = false;
  isRefreshing = false;
  nearGasStations: Array<any> = [];
  topGasStations: Array<any> = [];
  nearCheapStations: Array<any> = [];
  gasTypes: Array<any> = [];

  // Summary stats
  averageNearPrice: number | null = null;
  closestDistanceKm: number | null = null;
  // Number of stations within the selected radius
  nearStationsWithinRadiusCount = 0;
  // Section counters
  nearCheapStationsCount = 0;
  nearNearestStationsCount = 0;
  topStationsCount = 0;

  // Expandable sections
  visibleCount = 5;
  cheapExpanded = false;
  nearExpanded = false;

  myLocation: any = {};
  chosenGasType: any = 3201;
  previousGasType: any = 3201;
  locationPermissionDenied = false;
  maxDistance = 10;

  constructor(private gasService: GasService) {
  }

  async ngOnInit(): Promise<void> {
    // Load saved gas type
    const {value} = await Preferences.get({key: 'gasType'});
    if (value) {
      this.chosenGasType = parseInt(value, 10);
      this.previousGasType = this.chosenGasType;
    }

    // Load saved max distance
    const {value: maxDist} = await Preferences.get({key: 'maxDistance'});
    if (maxDist) {
      this.MAX_DISTANCE = parseInt(maxDist, 10);
      this.maxDistance = this.MAX_DISTANCE;
    }

    this.gasService.getTypesOfGas().subscribe((response) => {
      this.gasTypes = response['resultado'];
      this.loadStations();
    });
  }

  getChosenGasTypeName() {
    const gasType = this.gasTypes.find((i) => i['Id'] === this.chosenGasType);
    return gasType ? gasType['Descritivo'] : 'Selecionar';
  }

  openFuelSelect() {
    this.fuelSelect.open();
  }

  async changeGasType(e: any) {
    const newType = e.detail.value;

    if (newType && newType !== this.previousGasType) {
      this.previousGasType = newType;
      await Preferences.set({key: 'gasType', value: newType.toString()});
      this.gasService.clearCache();
      this.loadStations();
    }
  }

  async changeMaxDistance(event: any): Promise<void> {
    this.MAX_DISTANCE = event.detail.value;
    this.maxDistance = this.MAX_DISTANCE;
    await Preferences.set({key: 'maxDistance', value: this.MAX_DISTANCE.toString()});

    // Re-filter near cheap stations with new distance
    // Use the last loaded data
    if (this.nearGasStations && this.nearGasStations.length > 0) {
      // Get all stations from last API call
      this.gasService.getNearestGasStations(this.chosenGasType).subscribe((response) => {
        this.loadNearCheapStations(response['resultado']);
        // Update map with new filtered stations
        setTimeout(() => this.updateMap(), 100);
      });
    }
  }

  async handleRefresh(event: any): Promise<void> {
    this.isRefreshing = true;
    this.gasService.clearCache();
    this.loadStations();
    this.isRefreshing = false;
    event.target.complete();
  }

  loadStations() {
    this.loaded = false;
    this.nearGasStations = [];
    this.nearCheapStations = [];

    // Reset map state so it can be re-initialized
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.mapInitialized = false;

    this.loadLocation();
    this.loadNearGasStations();
  }

  isEverythingLoaded(): boolean {
    return (
      this.nearGasStations &&
      this.nearGasStations.length > 0 &&
      this.nearCheapStations &&
      this.nearCheapStations.length > 0
    );
  }

  // NEAREST STATIONS LIST
  loadLocation() {
    Geolocation.getCurrentPosition({enableHighAccuracy: true, timeout: 10000})
      .then((resp) => {
        this.myLocation = [resp.coords.latitude, resp.coords.longitude];
        this.locationPermissionDenied = false;
        this.loadNearGasStations();
      })
      .catch((error) => {
        console.warn('Geolocation error:', error);
        this.myLocation = [38.741613027820385, -9.146299151201234];
        this.locationPermissionDenied = true;
        this.loadNearGasStations();
      });
  }

  async requestLocationPermission(): Promise<void> {
    this.loadLocation();
  }

  loadNearGasStations() {
    this.gasService
      .getNearestGasStations(this.chosenGasType)
      .subscribe((response) => {
        const allStations = response['resultado'] || [];

        // Sort by distance and keep only the first MAX_NUMBER_RESULTS for display
        const orderedStations = this.orderByLocation(allStations);
        this.nearGasStations = this.editPricingTag(orderedStations);

        // Number of stations actually displayed in the "Mais Perto" section
        this.nearNearestStationsCount = this.nearGasStations.length;

        // Compute closest distance from the ordered list (already nearest-first)
        if (this.nearGasStations.length > 0) {
          const first = this.nearGasStations[0];
          const coords = [first['Latitude'], first['Longitude']];
          this.closestDistanceKm = this.calculateDistance(this.myLocation, coords);
        } else {
          this.closestDistanceKm = null;
        }

        // Average price across the displayed nearest stations
        if (this.nearGasStations.length > 0) {
          const sum = this.nearGasStations.reduce((acc, station) => {
            return acc + this.gasService.parsePrice(station['Preco']);
          }, 0);
          this.averageNearPrice = sum / this.nearGasStations.length;
        } else {
          this.averageNearPrice = null;
        }

        this.loadNearCheapStations(allStations);

        this.loaded = this.isEverythingLoaded();
      });
  }

  editPricingTag(stations: Array<any>): Array<any> {
    stations.forEach((element) => {
      if (!element['Preco'].includes('litro')) {
        element['Preco'] += '/litro';
      }
    });
    return stations;
  }

  orderByLocation(response: Array<any>): Array<any> {
    return response
      .sort((a, b) => {
        const coordsA = [a['Latitude'], a['Longitude']];
        const coordsB = [b['Latitude'], b['Longitude']];

        if (
          this.calculateDistance(this.myLocation, coordsA) <
          this.calculateDistance(this.myLocation, coordsB)
        )
          return -1;
        if (
          this.calculateDistance(this.myLocation, coordsA) >
          this.calculateDistance(this.myLocation, coordsB)
        )
          return 1;
        return 0;
      })
      .slice(0, this.MAX_NUMBER_RESULTS);
  }

  calculateDistance(coords1: any[], coords2: any[]) {
    let p = 0.017453292519943295;
    let c = Math.cos;
    let a =
      0.5 -
      c((coords2[0] - coords1[0]) * p) / 2 +
      (c(coords1[0] * p) *
        c(coords2[0] * p) *
        (1 - c((coords2[1] - coords1[1]) * p))) /
      2;

    return 12742 * Math.asin(Math.sqrt(a));
  }

  // CHEAPEST AND NEAREST STATIONS LIST
  loadNearCheapStations(stations: Array<any>) {
    // All stations within the selected radius
    const withinRadius = stations.filter((obj) => {
      return (
        this.calculateDistance(this.myLocation, [
          obj['Latitude'],
          obj['Longitude'],
        ]) <= this.maxDistance
      );
    });

    // Global counter for "nearby" stations (used in the summary card)
    this.nearStationsWithinRadiusCount = withinRadius.length;

    // Sorted and limited list for the "Mais Baratas Perto de Ti" section
    const sortedByPrice = withinRadius
      .sort((a, b) => {
        const priceA = parseFloat(
          a['Preco'].replace(/,/g, '.').slice(0, a['Preco'].indexOf('€') - 1)
        );
        const priceB = parseFloat(
          b['Preco'].replace(/,/g, '.').slice(0, b['Preco'].indexOf('€') - 1)
        );

        if (priceA < priceB) return -1;
        if (priceA > priceB) return 1;
        return 0;
      })
      .slice(0, this.MAX_NUMBER_RESULTS);

    this.nearCheapStations = this.editPricingTag(sortedByPrice);
    this.nearCheapStationsCount = this.nearCheapStations.length;

    this.loaded = this.isEverythingLoaded();
  }

  // CHEAPEST STATIONS LIST
  loadCheapestGasStations() {
    this.gasService
      .getTopGasStations(this.MAX_NUMBER_RESULTS, this.chosenGasType)
      .subscribe((response) => {
        const result = response['resultado'] || [];
        this.topGasStations = result;
        this.topStationsCount = result.length;
        this.loaded = this.isEverythingLoaded();
      });
  }

  // Helper methods for compatibility with template
  toggleFavorite(station: any): void {
    // Placeholder for favorites feature
    console.log('Toggle favorite:', station);
  }

  viewStationDetails(station: any): void {
    // Placeholder for station details
    console.log('View station details:', station);
  }

  calculateSavings(price: string): number {
    return 0; // Placeholder
  }

  getAverageNearPriceLabel(): string {
    if (this.averageNearPrice == null) {
      return '-';
    }
    return this.gasService.formatPrice(this.averageNearPrice);
  }

  getClosestDistanceLabel(): string {
    if (this.closestDistanceKm == null) {
      return '-';
    }
    return `${this.closestDistanceKm.toFixed(1)} km`;
  }

  getVisibleStations(stations: Array<any>, expanded: boolean): Array<any> {
    if (expanded) {
      return stations;
    }
    return stations.slice(0, this.visibleCount);
  }

  formatDistancePin = (value: number) => {
    return `${value} km`;
  }

  ngAfterViewChecked(): void {
    if (this.loaded && !this.mapInitialized && this.getAllStationsForMap().length > 0) {
      setTimeout(() => this.initMap(), 100);
    }
  }

  getAllStationsForMap(): Array<any> {
    // Only show half of the stations from "Mais perto" section
    const stations = this.nearGasStations || [];
    const half = Math.ceil(stations.length / 2);
    return stations.slice(0, half);
  }

  private initMap(): void {
    const mapElement = document.getElementById('map');
    if (!mapElement || this.mapInitialized) return;

    this.mapInitialized = true;

    // Initialize map centered on user location
    const lat = this.myLocation[0] || 38.7;
    const lng = this.myLocation[1] || -9.1;

    this.map = L.map('map').setView([lat, lng], 13);

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // Add user location marker
    const userIcon = L.divIcon({
      className: 'user-marker',
      html: '<div style="width:16px;height:16px;background:#1e88e5;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    L.marker([lat, lng], { icon: userIcon }).addTo(this.map).bindPopup('A sua localização');

    // Add station markers
    this.addStationMarkers();

    // Fit bounds to show all markers
    this.fitMapBounds();
  }

  private addStationMarkers(): void {
    const stations = this.getAllStationsForMap();

    stations.forEach((station, index) => {
      if (!station.Latitude || !station.Longitude) return;

      const price = station.Preco?.split('/')[0]?.trim() || station.Preco || '';
      const logoUrl = this.getStationLogo(station);

      // Determine marker color - green for cheapest in this list
      let bgColor = '#1e88e5'; // primary blue

      // Find cheapest station to highlight it
      const cheapestPrice = Math.min(...stations.map(s => this.parseStationPrice(s)));
      const currentPrice = this.parseStationPrice(station);
      if (currentPrice === cheapestPrice) {
        bgColor = '#43a047'; // green for cheapest
      }

      const markerHtml = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 6px;
            background: ${bgColor};
            color: white;
            padding: 6px 10px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 800;
            white-space: nowrap;
            border: 2px solid white;
          ">
            <img src="${logoUrl}" style="width:20px;height:20px;border-radius:4px;background:white;object-fit:contain;" onerror="this.style.display='none'" />
            <span>${price}</span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 8px solid ${bgColor};
            margin-top: -2px;
          "></div>
        </div>
      `;

      const priceIcon = L.divIcon({
        className: 'station-marker',
        html: markerHtml,
        iconSize: [100, 50],
        iconAnchor: [50, 50]
      });

      const marker = L.marker([station.Latitude, station.Longitude], { icon: priceIcon })
        .addTo(this.map);

      // Add popup with station info
      marker.bindPopup(`
        <div style="text-align:center;min-width:150px;">
          <img src="${logoUrl}" style="width:40px;height:40px;border-radius:8px;margin-bottom:8px;object-fit:contain;" onerror="this.style.display='none'" />
          <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${station.Nome || 'Posto'}</div>
          <div style="font-size:18px;font-weight:800;color:#1e88e5;margin-bottom:4px;">${station.Preco}</div>
          <div style="font-size:12px;color:#666;">${station.Morada || station.Localidade || ''}</div>
        </div>
      `);
    });
  }

  private parseStationPrice(station: any): number {
    if (!station?.Preco) return Infinity;
    const priceStr = station.Preco.replace(/[^\d,\.]/g, '').replace(',', '.');
    return parseFloat(priceStr) || Infinity;
  }

  private getStationLogo(station: any): string {
    const defaultLogo = 'https://cdn-icons-png.flaticon.com/512/2698/2698011.png';
    const logos: Record<string, string> = {
      'galp': 'https://play-lh.googleusercontent.com/c35iec9F_7Hb2YCKY1wMyxy1kcp8A9JdbGw2v7R2hgOQm4jGxSTKASEt0zgJAxgBgbU',
      'bp': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d2/BP_Helios_logo.svg/1200px-BP_Helios_logo.svg.png',
      'prio': 'https://cdn.cookielaw.org/logos/f3b87880-8639-4d8d-8936-b332ceb16fe9/d45e2d7b-bd89-4f8b-9ecb-24e69a30d35f/4841f480-ee75-4b8b-804a-bd1fa672698a/prio_logo.jpeg',
      'rede energia': 'https://www.redeenergia.pt/wp-content/themes/understrap-child-master/img/og-thumb-2.png',
      'leclerc': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Logo_E.Leclerc_Sans_le_texte.svg/1200px-Logo_E.Leclerc_Sans_le_texte.svg.png',
      'intermarché': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Intermarch%C3%A9_logo_2009.svg/1200px-Intermarch%C3%A9_logo_2009.svg.png',
      'intermarche': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Intermarch%C3%A9_logo_2009.svg/1200px-Intermarch%C3%A9_logo_2009.svg.png',
      'auchan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Auchan_logo.svg/1200px-Auchan_logo.svg.png',
      'repsol': 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Repsol_2025_%28Isotype%29.svg',
      'ecobrent': 'https://www.ecobrent.com/imagens/logo.png',
      'shell': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e8/Shell_logo.svg/1200px-Shell_logo.svg.png',
      'cepsa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cepsa_logo.svg/1200px-Cepsa_logo.svg.png',
      'pingo doce': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQoHstOh2cOVlmMSLTJyBpuo9kgxfMAnOFYdw&s',
      'petroprix': 'https://petroprix.pt/wp-content/uploads/2022/09/petroprix_logo.jpg',
      'moeve': 'https://logowik.com/content/uploads/images/moeve9729.logowik.com.webp',
      'alves bandeira': 'https://play-lh.googleusercontent.com/B_f5GP-3sd5tywdSwoCis-zkYzTV8jPhD6owV3XG-FSActQyXDn67ylqcRoM0OfGbWQQ',
      'recheio': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZrz1UJ42U0k7IS7LEJ84eO4Vl6BtdcqwieA&s',
      'plenergy': 'https://play-lh.googleusercontent.com/bYTqEuVqdhm_T5RYEPHNleoI7X04rU7ztajvbbMjxhsYNlyIjcREtTFzg7BecZfVYwk',
    };

    const marca = (station.Marca || '').toLowerCase();
    const nome = (station.Nome || '').toLowerCase();

    for (const [key, url] of Object.entries(logos)) {
      if (marca.includes(key) || nome.includes(key)) {
        return url;
      }
    }
    return defaultLogo;
  }

  private fitMapBounds(): void {
    const stations = this.getAllStationsForMap();
    if (stations.length === 0) return;

    const bounds = L.latLngBounds([]);

    // Add user location
    if (this.myLocation[0] && this.myLocation[1]) {
      bounds.extend([this.myLocation[0], this.myLocation[1]]);
    }

    // Add all stations
    stations.forEach(station => {
      if (station.Latitude && station.Longitude) {
        bounds.extend([station.Latitude, station.Longitude]);
      }
    });

    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [30, 30] });
    }
  }

  private updateMap(): void {
    if (!this.map) return;

    // Clear existing markers except user location
    this.map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker || layer._icon?.classList?.contains('price-marker')) {
        this.map.removeLayer(layer);
      }
    });

    // Re-add user marker
    const lat = this.myLocation[0] || 38.7;
    const lng = this.myLocation[1] || -9.1;
    const userIcon = L.divIcon({
      className: 'user-marker',
      html: '<div style="width:16px;height:16px;background:#1e88e5;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    L.marker([lat, lng], { icon: userIcon }).addTo(this.map).bindPopup('A sua localização');

    // Re-add station markers
    this.addStationMarkers();
    this.fitMapBounds();
  }
}
