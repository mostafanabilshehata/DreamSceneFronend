import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BasketService } from '../services/basket.service';
import { ApiService } from '../services/api.service';
import { AlertService } from '../services/alert.service';
import { Basket, OrderRequest } from '../models/api.models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  checkoutForm: FormGroup;
  basket: Basket = { items: [], totalItems: 0, totalAmount: 0 };
  submitting: boolean = false;
  orderSubmitted: boolean = false;

  constructor(
    private fb: FormBuilder,
    private basketService: BasketService,
    private apiService: ApiService,
    private router: Router,
    private alertService: AlertService
  ) {
    this.checkoutForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      userEmail: ['', [Validators.required, Validators.email]],
      userPhone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]]
    });
  }

  ngOnInit(): void {
    this.basketService.basket$.subscribe(basket => {
      this.basket = basket;
      if (basket.items.length === 0 && !this.orderSubmitted) {
        this.router.navigate(['/basket']);
      }
    });
  }

  get f() {
    return this.checkoutForm.controls;
  }

  submitOrder(): void {
    if (this.checkoutForm.invalid) {
      Object.keys(this.checkoutForm.controls).forEach(key => {
        this.checkoutForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (this.basket.items.length === 0) {
      this.alertService.warning('Empty Basket', 'Your basket is empty! Please add items before checkout.');
      return;
    }

    this.submitting = true;

    const orderRequest: OrderRequest = {
      userName: this.checkoutForm.value.userName,
      userEmail: this.checkoutForm.value.userEmail,
      userPhone: this.checkoutForm.value.userPhone,
      items: this.basket.items.map(basketItem => ({
        itemId: basketItem.item.id,
        quantity: basketItem.quantity,
        type: basketItem.type,
        rentDays: basketItem.type === 'RENT' ? basketItem.rentDays : undefined
      }))
    };

    this.apiService.createOrder(orderRequest).subscribe({
      next: (response) => {
        this.submitting = false;
        this.orderSubmitted = true;
        this.basketService.clearBasket();
        this.alertService.success('Order Submitted!', 'Your order has been placed successfully! We will contact you soon via email or phone.');
        setTimeout(() => {
          this.router.navigate(['/my-orders'], { 
            queryParams: { email: orderRequest.userEmail } 
          });
        }, 2000);
      },
      error: (err) => {
        console.error('Error submitting order:', err);
        this.submitting = false;
        this.alertService.error('Order Failed', 'Failed to submit your order. Please check your information and try again.');
      }
    });
  }

  goToBasket(): void {
    this.router.navigate(['/basket']);
  }
}
