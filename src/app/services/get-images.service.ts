import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class GetImagesService {

  constructor(private _httpClient: HttpClient) { }

  getProducts(): Observable<any> {
    return this._httpClient.get('https://ecommerce.routemisr.com/api/v1/products')
  }
}
