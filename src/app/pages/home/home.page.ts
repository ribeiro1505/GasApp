import { Component, OnInit } from '@angular/core';
import { GasService } from 'src/app/services/gas.service';
import { Geolocation } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  MAX_DISTANCE = 10;
  MAX_NUMBER_RESULTS = 20;

  loaded = false;
  isRefreshing = false;
  nearGasStations: Array<any> = [];
  topGasStations: Array<any> = [];
  nearCheapStations: Array<any> = [];
  gasTypes: Array<any> = [];

  myLocation: any = {};
  chosenGasType: any = 3201;
  previousGasType: any = 3201;
  locationPermissionDenied = false;
  maxDistance = 10;

  constructor(private gasService: GasService) {}

  async ngOnInit(): Promise<void> {
    // Load saved gas type
    const { value } = await Preferences.get({ key: 'gasType' });
    if (value) {
      this.chosenGasType = parseInt(value, 10);
      this.previousGasType = this.chosenGasType;
    }

    // Load saved max distance
    const { value: maxDist } = await Preferences.get({ key: 'maxDistance' });
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
    return gasType ? gasType['Descritivo'] : '';
  }

  async changeGasType(e: any) {
    const newType = e.detail.value;

    if (newType && newType !== this.previousGasType) {
      this.previousGasType = newType;
      await Preferences.set({ key: 'gasType', value: newType.toString() });
      this.gasService.clearCache();
      this.loadStations();
    }
  }

  async changeMaxDistance(event: any): Promise<void> {
    this.MAX_DISTANCE = event.detail.value;
    this.maxDistance = this.MAX_DISTANCE;
    await Preferences.set({ key: 'maxDistance', value: this.MAX_DISTANCE.toString() });

    // Re-filter near cheap stations with new distance
    // Use the last loaded data
    if (this.nearGasStations && this.nearGasStations.length > 0) {
      // Get all stations from last API call
      this.gasService.getNearestGasStations(this.chosenGasType).subscribe((response) => {
        this.loadNearCheapStations(response['resultado']);
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
    this.topGasStations = [];
    this.nearCheapStations = [];

    this.loadLocation();
    this.loadNearGasStations();
    this.loadCheapestGasStations();
  }

  isEverythingLoaded(): boolean {
    return (
      this.nearGasStations &&
      this.nearGasStations.length > 0 &&
      this.topGasStations &&
      this.topGasStations.length > 0 &&
      this.nearCheapStations &&
      this.nearCheapStations.length > 0
    );
  }

  // NEAREST STATIONS LIST
  loadLocation() {
    Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 })
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
        this.nearGasStations = this.editPricingTag(
          this.orderByLocation(response['resultado'])
        );
        this.loadNearCheapStations(response['resultado']);

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
    this.nearCheapStations = this.editPricingTag(
      stations
        .filter((obj) => {
          return (
            this.calculateDistance(this.myLocation, [
              obj['Latitude'],
              obj['Longitude'],
            ]) <= this.maxDistance
          );
        })
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
        .slice(0, this.MAX_NUMBER_RESULTS)
    );
    this.loaded = this.isEverythingLoaded();
  }

  // CHEAPEST STATIONS LIST
  loadCheapestGasStations() {
    this.gasService
      .getTopGasStations(this.MAX_NUMBER_RESULTS, this.chosenGasType)
      .subscribe((response) => {
        this.topGasStations = response['resultado'];
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
}
