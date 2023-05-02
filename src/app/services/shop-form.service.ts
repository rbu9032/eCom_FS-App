import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { City } from '../common/city';
import { State } from '../common/state';

@Injectable({
  providedIn: 'root'
})
export class ShopFormService {

  private statesUrl = environment.luv2shopApiUrl + '/states?size=36';
  private citiesUrl = environment.luv2shopApiUrl + '/cities';


  constructor(private httpClient: HttpClient) { }
  
  getStates(): Observable<State[]> {

    return this.httpClient.get<GetResponseStates>(this.statesUrl).pipe(
      map(response => response._embedded.states)
    );
  }

  getCities(theStateCode: string): Observable<City[]> {

    // search url
    const searchCitiesUrl = `${this.citiesUrl}/search/findByStateCode?code=${theStateCode}`;

    return this.httpClient.get<GetResponseCities>(searchCitiesUrl).pipe(
      map(response => response._embedded.cities)
    );
  }

  
  getCreditCardMonths(startMonth: number): Observable<number[]>{
    
    let data: number[] = [];

    //let build an array for "Month" dropdown list
    //start at current start Month and loop until 12
    //
    for(let theMonth = startMonth; theMonth <= 12; theMonth++){
      data.push(theMonth);
    }
    return of(data);
  }

  getCreditCardYears(): Observable<number[]>{
    
    let data: number[] = [];

    //let build an array for "Year" dropdown list
    //start at current start Year and loop until 10 years
    //
    const startYear: number = new Date().getFullYear();
    const endYear: number = startYear + 10;

    for(let theYear = startYear; theYear <= endYear; theYear++){
      data.push(theYear);
    }
    return of(data);
  }
}

interface GetResponseStates {
  _embedded: {
    states: State[];
  }
}
interface GetResponseCities {
  _embedded: {
    cities: City[];
  }
}

