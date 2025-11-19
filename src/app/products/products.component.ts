import { Component, OnInit } from '@angular/core';
import { NavComponent } from '../nav/nav.component';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ProductsService } from '../services/products.service';
import { NgClass, NgFor } from '@angular/common';
import { Product } from '../models/product.model';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [ NavComponent, CommonModule, HttpClientModule, NgFor],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  category: string = '';
  subcategory: string = '';
  
  constructor(
    private _ProductsService: ProductsService,
    private _CartService: CartService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Get query parameters
    this.route.queryParams.subscribe(params => {
      this.category = params['category'] || '';
      this.subcategory = params['subcategory'] || '';
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this._ProductsService.getProducts().subscribe({
      next: (response) => {
        // Map products to include default availability
        this.products = response.data.map((product: any) => ({
          ...product,
          availability: product.availability || 'both',
          salePrice: product.salePrice || product.price,
          rentPrice: product.rentPrice || Math.round(product.price * 0.3)
        }));
        this.filterProducts();
      }
    });
  }

  filterProducts(): void {
    if (this.category && this.subcategory) {
      // Filter by category and subcategory (when backend is ready)
      this.filteredProducts = this.products;
    } else {
      this.filteredProducts = this.products;
    }
  }

  addToCart(productId: string, type: 'sale' | 'rent'): void {
    const product = this.products.find(p => p._id === productId);
    if (product && product.stockQuantity === 0) {
      alert('This item is out of stock');
      return;
    }
    
    this._CartService.addToCart(productId, type).subscribe({
      next: (response) => {
        console.log('Added to cart:', response);
        // TODO: Show success message
      },
      error: (err) => console.log(err)
    });
  }

  canSale(product: Product): boolean {
    return product.availability === 'sale' || product.availability === 'both';
  }

  canRent(product: Product): boolean {
    return product.availability === 'rent' || product.availability === 'both';
  }

  isOutOfStock(product: Product): boolean {
    return product.stockQuantity === 0;
  }
}
