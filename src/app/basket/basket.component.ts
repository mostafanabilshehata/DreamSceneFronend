import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BasketService } from '../services/basket.service';
import { AlertService } from '../services/alert.service';
import { Basket, BasketItem } from '../models/api.models';

@Component({
  selector: 'app-basket',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './basket.component.html',
  styleUrl: './basket.component.css'
})
export class BasketComponent implements OnInit {
  basket: Basket = { items: [], totalItems: 0, totalAmount: 0 };

  constructor(
    private basketService: BasketService,
    private router: Router,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.basketService.basket$.subscribe(basket => {
      this.basket = basket;
    });
  }

  updateQuantity(itemId: number, type: 'SALE' | 'RENT', newQuantity: number): void {
    if (newQuantity < 1) {
      this.removeItem(itemId, type);
      return;
    }
    this.basketService.updateItemQuantity(itemId, type, newQuantity);
  }

  updateRentDays(itemId: number, newDays: number): void {
    if (newDays < 1) return;
    this.basketService.updateRentDays(itemId, newDays);
  }

  removeItem(itemId: number, type: 'SALE' | 'RENT'): void {
    if (confirm('Remove this item from basket?')) {
      this.basketService.removeItem(itemId, type);
    }
  }

  clearBasket(): void {
    if (confirm('Clear all items from basket?')) {
      this.basketService.clearBasket();
    }
  }

  goToCheckout(): void {
    if (this.basket.items.length === 0) {
      this.alertService.warning('Empty Basket', 'Your basket is empty! Please add items before proceeding to checkout.');
      return;
    }
    this.router.navigate(['/checkout']);
  }

  continueShopping(): void {
    this.router.navigate(['/']);
  }

  getItemTotal(basketItem: BasketItem): number {
    if (basketItem.type === 'SALE' && basketItem.item.salePrice) {
      return basketItem.item.salePrice * basketItem.quantity;
    } else if (basketItem.type === 'RENT' && basketItem.item.rentPrice && basketItem.rentDays) {
      return basketItem.item.rentPrice * basketItem.quantity * basketItem.rentDays;
    }
    return 0;
  }
}
