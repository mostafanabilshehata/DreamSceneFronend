import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Token } from '@angular/compiler';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  constructor(private _HttpClient: HttpClient) { }

  headers: any = { Token: localStorage.getItem('userToken') }

  addToCart(productId: string, type: 'sale' | 'rent' = 'sale'): Observable<any> {
    return this._HttpClient.post('https://ecommerce.routemisr.com/api/v1/cart',
      { 
        productId: productId,
        type: type  // Added type parameter for sale/rent
      }, {
      headers: this.headers
    })
  }

  getLoggedUserCart(): Observable<any> {
    return this._HttpClient.get('https://ecommerce.routemisr.com/api/v1/cart',
      {
        headers: this.headers
      })
  }


  removeCartItem(productId: string): Observable<any> {
    return this._HttpClient.delete(`https://ecommerce.routemisr.com/api/v1/cart/${productId}`,
      {
        headers: this.headers
      })
  }

  updateItemCount(productId: string, count: number): Observable<any> {
    return this._HttpClient.put(`https://ecommerce.routemisr.com/api/v1/cart/${productId}`, {
      count: count
    },
      {
        headers: this.headers
      })
  }


}
