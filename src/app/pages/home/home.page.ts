import { Component, OnInit } from '@angular/core';
import { GasService } from 'src/app/services/gas.service';
import { Geolocation } from '@awesome-cordova-plugins/geolocation/ngx';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  MAX_DISTANCE = 10;
  MAX_NUMBER_RESULTS = 20;

  loaded = false;
  nearGasStations: Array<any> = [];
  topGasStations: Array<any> = [];
  nearCheapStations: Array<any> = [];

  myLocation: any = {};
  gasType: number = 3201;

  constructor(
    private gasService: GasService,
    private geolocation: Geolocation
  ) {}

  ngOnInit(): void {
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
    this.geolocation
      .getCurrentPosition()
      .then((resp) => {
        this.myLocation = [resp.coords.latitude, resp.coords.longitude];
        this.loadNearGasStations();
      })
      .catch((error) => {
        this.myLocation = [38.741613027820385, -9.146299151201234];
        this.loadNearGasStations();
      });
  }

  loadNearGasStations() {
    this.gasService
      .getNearestGasStations(this.gasType)
      .subscribe((response) => {
        this.nearGasStations = this.orderByLocation(response['resultado']);
        this.loadNearCheapStations(response['resultado']);

        this.loaded = this.isEverythingLoaded();
      });
  }

  orderByLocation(response: Array<any>): Array<any> {
    return response
      .sort((a, b) => {
        a = [a['Latitude'], a['Longitude']];
        b = [b['Latitude'], b['Longitude']];

        if (
          this.calculateDistance(this.myLocation, a) <
          this.calculateDistance(this.myLocation, b)
        )
          return -1;
        if (
          this.calculateDistance(this.myLocation, a) >
          this.calculateDistance(this.myLocation, b)
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
    this.nearCheapStations = stations
      .filter((obj) => {
        return (
          this.calculateDistance(this.myLocation, [
            obj['Latitude'],
            obj['Longitude'],
          ]) <= this.MAX_DISTANCE
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
      .slice(0, this.MAX_NUMBER_RESULTS);
    this.loaded = this.isEverythingLoaded();
  }

  // CHEAPEST STATIONS LIST
  loadCheapestGasStations() {
    this.gasService
      .getTopGasStations(this.MAX_NUMBER_RESULTS, this.gasType)
      .subscribe((response) => {
        this.topGasStations = response['resultado'];
        this.loaded = this.isEverythingLoaded();
      });
  }
}
