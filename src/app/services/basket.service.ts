import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Basket, BasketItem, Item } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class BasketService {
  private readonly STORAGE_KEY = 'shopping_basket';
  private basketSubject: BehaviorSubject<Basket>;
  public basket$: Observable<Basket>;

  constructor() {
    const savedBasket = this.loadBasketFromStorage();
    this.basketSubject = new BehaviorSubject<Basket>(savedBasket);
    this.basket$ = this.basketSubject.asObservable();
  }

  private loadBasketFromStorage(): Basket {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const basket = JSON.parse(stored) as Basket;
        return basket;
      }
    } catch (error) {
      console.error('Error loading basket from storage:', error);
    }
    return this.createEmptyBasket();
  }

  private saveBasketToStorage(basket: Basket): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(basket));
    } catch (error) {
      console.error('Error saving basket to storage:', error);
    }
  }

  private createEmptyBasket(): Basket {
    return {
      items: [],
      totalItems: 0,
      totalAmount: 0
    };
  }

  private calculateTotals(items: BasketItem[]): { totalItems: number; totalAmount: number } {
    let totalItems = 0;
    let totalAmount = 0;

    items.forEach(basketItem => {
      totalItems += basketItem.quantity;
      
      if (basketItem.type === 'SALE' && basketItem.item.salePrice) {
        totalAmount += basketItem.item.salePrice * basketItem.quantity;
      } else if (basketItem.type === 'RENT' && basketItem.item.rentPrice && basketItem.rentDays) {
        totalAmount += basketItem.item.rentPrice * basketItem.quantity * basketItem.rentDays;
      }
    });

    return { totalItems, totalAmount };
  }

  private updateBasket(items: BasketItem[]): void {
    const { totalItems, totalAmount } = this.calculateTotals(items);
    const basket: Basket = { items, totalItems, totalAmount };
    this.basketSubject.next(basket);
    this.saveBasketToStorage(basket);
  }

  getBasket(): Basket {
    return this.basketSubject.value;
  }

  addItem(item: Item, type: 'SALE' | 'RENT', quantity: number = 1, rentDays?: number): void {
    const currentBasket = this.getBasket();
    const items = [...currentBasket.items];

    // Check if item with same type already exists
    const existingIndex = items.findIndex(
      bi => bi.item.id === item.id && bi.type === type
    );

    if (existingIndex !== -1) {
      // Update existing item
      items[existingIndex] = {
        ...items[existingIndex],
        quantity: items[existingIndex].quantity + quantity,
        rentDays: type === 'RENT' ? rentDays : undefined
      };
    } else {
      // Add new item
      const basketItem: BasketItem = {
        item,
        quantity,
        type,
        rentDays: type === 'RENT' ? rentDays : undefined
      };
      items.push(basketItem);
    }

    this.updateBasket(items);
  }

  updateItemQuantity(itemId: number, type: 'SALE' | 'RENT', quantity: number): void {
    const currentBasket = this.getBasket();
    const items = [...currentBasket.items];

    const index = items.findIndex(bi => bi.item.id === itemId && bi.type === type);
    if (index !== -1) {
      if (quantity <= 0) {
        items.splice(index, 1);
      } else {
        items[index] = { ...items[index], quantity };
      }
      this.updateBasket(items);
    }
  }

  updateRentDays(itemId: number, rentDays: number): void {
    const currentBasket = this.getBasket();
    const items = [...currentBasket.items];

    const index = items.findIndex(bi => bi.item.id === itemId && bi.type === 'RENT');
    if (index !== -1 && rentDays > 0) {
      items[index] = { ...items[index], rentDays };
      this.updateBasket(items);
    }
  }

  removeItem(itemId: number, type: 'SALE' | 'RENT'): void {
    const currentBasket = this.getBasket();
    const items = currentBasket.items.filter(
      bi => !(bi.item.id === itemId && bi.type === type)
    );
    this.updateBasket(items);
  }

  clearBasket(): void {
    this.updateBasket([]);
  }

  getItemCount(): number {
    return this.getBasket().totalItems;
  }

  getTotalAmount(): number {
    return this.getBasket().totalAmount;
  }
}
