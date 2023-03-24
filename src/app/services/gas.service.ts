import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GasService {
  constructor(private http: HttpClient) {}

  getTopGasStations(qtdPorPagina: number, gasType: number): Observable<any> {
    const url = `https://precoscombustiveis.dgeg.gov.pt/api/PrecoComb/ListarTopPostos?qtdPorPagina=${qtdPorPagina}&idsTiposComb=${gasType}`;
    return this.http.get(url);
  }

  getNearestGasStations(gasType: number): Observable<any> {
    const url = `https://precoscombustiveis.dgeg.gov.pt/api/PrecoComb/PesquisarPostos?idsTiposComb=${gasType}&qtdPorPagina=`;
    return this.http.get(url);
  }

  getTypesOfGas(): Observable<any> {
    const url = `https://precoscombustiveis.dgeg.gov.pt/api/PrecoComb/GetTiposCombustiveis`;
    return this.http.get(url);
  }
}
