import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, of, BehaviorSubject} from 'rxjs';
import {tap, catchError, shareReplay, map} from 'rxjs/operators';
import {Preferences} from '@capacitor/preferences';

export interface GasStation {
  Id?: string;
  Nome: string;
  Marca?: string;
  Morada?: string;
  Localidade?: string;
  Latitude: number;
  Longitude: number;
  Preco: string;
  TipoCombustivel?: string;
  DataAtualizacao?: string;
  distance?: number;
}

export interface PriceHistory {
  date: string;
  price: number;
}

@Injectable({
  providedIn: 'root',
})
export class GasService {
  private readonly BASE_URL = 'https://precoscombustiveis.dgeg.gov.pt/api/PrecoComb';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private http: HttpClient) {
  }

  /**
   * Get top gas stations with caching
   */
  getTopGasStations(qtdPorPagina: number, gasType: number): Observable<any> {
    const cacheKey = `top-${qtdPorPagina}-${gasType}`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return of(cached);
    }

    const url = `${this.BASE_URL}/ListarTopPostos?qtdPorPagina=${qtdPorPagina}&idsTiposComb=${gasType}`;
    return this.http.get(url).pipe(
      tap(data => this.setCache(cacheKey, data)),
      catchError(error => {
        console.error('Error fetching top gas stations:', error);
        return of({resultado: []});
      }),
      shareReplay(1)
    );
  }

  /**
   * Get nearest gas stations with caching
   * NOTE: qtdPorPagina left empty to get ALL stations (original API behavior)
   */
  getNearestGasStations(gasType: number, qtdPorPagina?: number): Observable<any> {
    const qty = qtdPorPagina !== undefined ? qtdPorPagina : ''; // Empty = get all stations
    const cacheKey = `nearest-${gasType}-${qty}`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return of(cached);
    }

    const url = `${this.BASE_URL}/PesquisarPostos?idsTiposComb=${gasType}&qtdPorPagina=${qty}`;
    return this.http.get(url).pipe(
      tap(data => this.setCache(cacheKey, data)),
      catchError(error => {
        console.error('Error fetching nearest gas stations:', error);
        return of({resultado: []});
      }),
      shareReplay(1)
    );
  }

  /**
   * Get types of gas with caching
   */
  getTypesOfGas(): Observable<any> {
    const cacheKey = 'gas-types';
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return of(cached);
    }

    const url = `${this.BASE_URL}/GetTiposCombustiveis`;
    return this.http.get(url).pipe(
      tap(data => this.setCache(cacheKey, data)),
      catchError(error => {
        console.error('Error fetching gas types:', error);
        return of({resultado: []});
      }),
      shareReplay(1)
    );
  }

  /**
   * Get gas stations by municipality
   */
  getStationsByMunicipality(municipalityId: string, gasType: number): Observable<any> {
    const url = `${this.BASE_URL}/PesquisarPostos?idsTiposComb=${gasType}&idMunicipio=${municipalityId}`;
    return this.http.get(url).pipe(
      catchError(error => {
        console.error('Error fetching stations by municipality:', error);
        return of({resultado: []});
      })
    );
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(coords1: [number, number], coords2: [number, number]): number {
    const p = 0.017453292519943295; // Math.PI / 180
    const c = Math.cos;
    const a =
      0.5 -
      c((coords2[0] - coords1[0]) * p) / 2 +
      (c(coords1[0] * p) *
        c(coords2[0] * p) *
        (1 - c((coords2[1] - coords1[1]) * p))) /
      2;

    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
  }

  /**
   * Parse price from string to number
   */
  parsePrice(priceStr: string): number {
    if (!priceStr) return 0;
    const cleanPrice = priceStr
      .replace(/[^\d,]/g, '')
      .replace(',', '.');
    return parseFloat(cleanPrice) || 0;
  }

  /**
   * Format price for display
   */
  formatPrice(price: number): string {
    return `${price.toFixed(3).replace('.', ',')} €/litro`;
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear specific cache entry
   */
  clearCacheEntry(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Price alerts management
   */
  async setPriceAlert(stationId: string, targetPrice: number): Promise<void> {
    try {
      const {value} = await Preferences.get({key: 'price-alerts'});
      const alerts = value ? JSON.parse(value) : {};
      alerts[stationId] = targetPrice;

      await Preferences.set({
        key: 'price-alerts',
        value: JSON.stringify(alerts)
      });
    } catch (error) {
      console.error('Error setting price alert:', error);
    }
  }

  async getPriceAlerts(): Promise<Record<string, number>> {
    try {
      const {value} = await Preferences.get({key: 'price-alerts'});
      return value ? JSON.parse(value) : {};
    } catch (error) {
      console.error('Error getting price alerts:', error);
      return {};
    }
  }

  async removePriceAlert(stationId: string): Promise<void> {
    try {
      const alerts = await this.getPriceAlerts();
      delete alerts[stationId];

      await Preferences.set({
        key: 'price-alerts',
        value: JSON.stringify(alerts)
      });
    } catch (error) {
      console.error('Error removing price alert:', error);
    }
  }

  /**
   * Price history (simulated - would need backend support for real data)
   */
  async savePriceHistory(stationId: string, price: number): Promise<void> {
    try {
      const {value} = await Preferences.get({key: `history-${stationId}`});
      const history: PriceHistory[] = value ? JSON.parse(value) : [];

      history.push({
        date: new Date().toISOString(),
        price: price
      });

// Keep only last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const filtered = history.filter(h => new Date(h.date) > thirtyDaysAgo);

      await Preferences.set({
        key: `history-${stationId}`,
        value: JSON.stringify(filtered)
      });
    } catch (error) {
      console.error('Error saving price history:', error);
    }
  }

  async getPriceHistory(stationId: string): Promise<PriceHistory[]> {
    try {
      const {value} = await Preferences.get({key: `history-${stationId}`});
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Error getting price history:', error);
      return [];
    }
  }

// Private helper methods
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}
