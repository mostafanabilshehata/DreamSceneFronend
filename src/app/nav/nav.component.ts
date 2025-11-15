import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BasketService } from '../services/basket.service';
import { CategoryService } from '../services/category.service';
import { ApiService } from '../services/api.service';
import { AlertService } from '../services/alert.service';
import { NgFor, CommonModule } from '@angular/common';
import { Category } from '../models/api.models';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, NgFor, CommonModule, FormsModule],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css', './nav-cart-badge.css']
})
export class NavComponent implements OnInit {
  scrolled: boolean = false;
  basketItemCount: number = 0;
  categories: Category[] = [];
  loading: boolean = true;
  isAdminRoute: boolean = false;
  
  // Track order modal
  showTrackOrderModal: boolean = false;
  trackingEmail: string = '';
  trackingPhone: string = '';
  trackingError: string = '';
  
  // Verification step
  verificationStep: 'email' | 'code' = 'email';
  verificationCode: string = '';
  codeSent: boolean = false;
  verifying: boolean = false;


  // Use the same hero image repeated for the slider
  // heroImages = [
  //   { src: 'assets/images/hero.png', alt: 'Hero' },
  //   { src: 'assets/images/hero.png', alt: 'Hero' },
  //   { src: 'assets/images/hero.png', alt: 'Hero' }
  // ];

  @HostListener ("window:scroll", [])
    onWindowScroll() {
        this.scrolled = window.scrollY > 100;
    }

  constructor(
    private categoryService: CategoryService,
    private basketService: BasketService,
    private router: Router,
    private apiService: ApiService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    // Check if current route is admin route
    this.router.events.subscribe(() => {
      this.isAdminRoute = this.router.url.startsWith('/admin');
    });
    
    // Initial check
    this.isAdminRoute = this.router.url.startsWith('/admin');
    
    // Subscribe to basket changes
    this.basketService.basket$.subscribe(basket => {
      this.basketItemCount = basket.totalItems;
    });
    
    this.categoryService.categories$.subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.loading = false;
      }
    });
  }
  
  openTrackOrderModal(): void {
    this.showTrackOrderModal = true;
    this.trackingEmail = '';
    this.trackingPhone = '';
    this.trackingError = '';
    this.verificationStep = 'email';
    this.verificationCode = '';
    this.codeSent = false;
  }
  
  closeTrackOrderModal(): void {
    this.showTrackOrderModal = false;
    this.trackingEmail = '';
    this.trackingPhone = '';
    this.trackingError = '';
    this.verificationStep = 'email';
    this.verificationCode = '';
    this.codeSent = false;
  }
  
  sendVerificationCode(): void {
    if (!this.trackingEmail) {
      this.trackingError = 'Please enter your email address';
      return;
    }
    
    if (!this.trackingEmail.includes('@')) {
      this.trackingError = 'Please enter a valid email address';
      return;
    }
    
    this.verifying = true;
    this.trackingError = '';
    
    this.apiService.sendVerificationCode(this.trackingEmail).subscribe({
      next: (message) => {
        this.verifying = false;
        this.codeSent = true;
        this.verificationStep = 'code';
        this.trackingError = '';
        this.alertService.success('Code Sent!', 'Please check your email for the 6-digit verification code.');
      },
      error: (err) => {
        this.verifying = false;
        this.trackingError = 'Failed to send verification code. Please try again.';
        this.alertService.error('Failed to Send', 'Could not send verification code. Please check your email and try again.');
        console.error('Error sending code:', err);
      }
    });
  }
  
  trackOrder(): void {
    if (this.verificationStep === 'email') {
      // If phone is provided, skip verification and track directly
      if (this.trackingPhone) {
        this.closeTrackOrderModal();
        this.router.navigate(['/my-orders'], { 
          queryParams: { search: this.trackingPhone } 
        });
        return;
      }
      
      // For email, send verification code
      this.sendVerificationCode();
      return;
    }
    
    // Verify code and then track
    if (!this.verificationCode || this.verificationCode.length !== 6) {
      this.trackingError = 'Please enter the 6-digit verification code';
      return;
    }
    
    this.verifying = true;
    this.trackingError = '';
    
    this.apiService.verifyCode(this.trackingEmail, this.verificationCode).subscribe({
      next: (verified) => {
        this.verifying = false;
        if (verified) {
          this.alertService.success('Verified!', 'Your email has been verified successfully.');
          
          // Save email BEFORE closing modal (modal clears the email)
          const emailToSearch = this.trackingEmail;
          this.closeTrackOrderModal();
          
          // Navigate with the saved email
          this.router.navigate(['/my-orders'], { 
            queryParams: { search: emailToSearch } 
          });
        } else {
          this.trackingError = 'Invalid or expired verification code';
          this.alertService.error('Verification Failed', 'The code you entered is invalid or has expired. Please try again.');
        }
      },
      error: (err) => {
        this.verifying = false;
        this.trackingError = 'Verification failed. Please try again.';
        this.alertService.error('Error', 'An error occurred during verification. Please try again.');
        console.error('Error verifying code:', err);
      }
    });
  }
  
  resendCode(): void {
    this.codeSent = false;
    this.verificationCode = '';
    this.sendVerificationCode();
  }
}