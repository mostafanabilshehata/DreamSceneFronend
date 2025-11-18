import { Component, OnInit,HostListener, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ProductsService } from '../services/products.service';
import { CartService } from '../services/cart.service';
import { ApiService } from '../services/api.service';
import { Partner } from '../models/api.models';
import { AnimateOnScrollDirective } from '../animate-on-scroll.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    AnimateOnScrollDirective,
    RouterLink,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [ProductsService, CartService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class HomeComponent implements OnInit {
  visible = false;
  // autoplayInterval = 3000; // default autoplay (3s)
// Use the same hero image repeated for the slider
heroImages = [
  { src: 'assets/images/backGround-1.jpg', alt: 'Decor' },
  { src: 'assets/images/backGround-2.jpg', alt: 'Decor2' },
  { src: 'assets/images/backGround-3.jpg', alt: 'Decor3' }
];
  
  // Partners loaded from API
  cards: Partner[] = [];
  loadingPartners: boolean = true;

  constructor(private apiService: ApiService) {}
  
  // pauseCarousel() {
  //   this.autoplayInterval = 0; // stops autoplay
  // }

  // resumeCarousel() {
  //   this.autoplayInterval = 3000; // resume autoplay
  // }

  displayedImages: any[] = [];
  productId: any;
  activeIndex = 0;
  intervalId: any;
  screenWidth = window.innerWidth;

  ngOnInit() {
    this.loadPartners();
    this.initializeCarousel();
  }

  initializeCarousel(): void {
    // Initialize Bootstrap carousel after view loads
    setTimeout(() => {
      const carouselElement = document.getElementById('heroCarousel');
      if (carouselElement) {
        // Ensure Bootstrap is loaded
        if (typeof (window as any).bootstrap !== 'undefined') {
          const carousel = new (window as any).bootstrap.Carousel(carouselElement, {
            interval: 4000,
            ride: 'carousel',
            touch: true,
            wrap: true,
            pause: false
          });
          carousel.cycle(); // Start cycling immediately
        } else {
          // Fallback: manually enable touch events
          this.enableTouchSwipe(carouselElement);
        }
      }
    }, 100);
  }

  enableTouchSwipe(element: HTMLElement): void {
    let touchStartX = 0;
    let touchEndX = 0;

    element.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    element.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe(touchStartX, touchEndX);
    }, { passive: true });
  }

  handleSwipe(startX: number, endX: number): void {
    const swipeThreshold = 50; // minimum distance for swipe
    const diff = startX - endX;

    if (Math.abs(diff) > swipeThreshold) {
      const carouselElement = document.getElementById('heroCarousel');
      if (carouselElement && typeof (window as any).bootstrap !== 'undefined') {
        const carousel = (window as any).bootstrap.Carousel.getInstance(carouselElement);
        if (carousel) {
          if (diff > 0) {
            carousel.next(); // Swipe left - next slide
          } else {
            carousel.prev(); // Swipe right - previous slide
          }
        }
      }
    }
  }

  loadPartners(): void {
    this.apiService.getAllPartners().subscribe({
      next: (partners) => {
        // Ensure all partners have proper gradient format
        this.cards = partners.map(partner => ({
          ...partner,
          gradient: this.formatGradient(partner.gradient || '#667eea, #764ba2')
        }));
        this.loadingPartners = false;
        
        // Only start auto-slide if there are multiple partners
        if (this.cards.length > 1) {
          // Set initial active index to middle card if there are at least 3 cards
          this.activeIndex = this.cards.length >= 3 ? Math.floor(this.cards.length / 2) : 0;
          this.startAutoSlide();
        } else {
          this.activeIndex = 0;
        }
      },
      error: (err) => {
        console.error('Error loading partners:', err);
        this.loadingPartners = false;
        // Fallback to empty array
        this.cards = [];
      }
    });
  }

  formatGradient(gradient: string): string {
    // If already has 'linear-gradient' or 'gradient', return as is
    if (gradient.includes('gradient')) {
      return gradient;
    }
    // Otherwise, format as linear-gradient
    return `linear-gradient(135deg, ${gradient})`;
  }

  ngOnDestroy() {
      this.clearAutoSlide();
    }
    
    @HostListener('window:resize', [])
    onResize() {
      this.screenWidth = window.innerWidth;
    }
  
    startAutoSlide() {
      this.intervalId = setInterval(() => {
        this.next();
      }, 3000);
    }
  
    clearAutoSlide() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }
  
    pause() {
      this.clearAutoSlide();
    }
  
    resume() {
      if (!this.intervalId) {
        this.startAutoSlide();
      }
    }
  
    getZIndex(i: number): number {
      const offset = Math.abs(this.activeIndex - i);
      return this.cards.length - offset;
    }
  
    getTransform(i: number): string {
      const offset = i - this.activeIndex;
  
      // Adjust spacing based on screen width
      let spacing = this.screenWidth < 600 ? 120 : 180;
  
      let scale = 0.7;
      let translateX = offset * spacing;
      let rotateY = offset * -15;
  
      if (i === this.activeIndex) {
        scale = 1.2;
        rotateY = 0;
      }
  
      return `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`;
    }
  
  
    prev() {
      this.activeIndex = (this.activeIndex - 1 + this.cards.length) % this.cards.length;
    }
  
    next() {
      this.activeIndex = (this.activeIndex + 1) % this.cards.length;
    }
  
    goToSlide(index: number) {
      this.activeIndex = index;
    }


  displayPermission(image: { open: boolean }) {
    image.open = !image.open;
    this.productId = image;
    console.log(this.productId);
  }



  

  // showDialog(id: any) {
  //   this.productId = id;
  //   this.visible = true;
  //   this.container.clear();
  //   this.componentRef = this.container.createComponent(ProductDetailsComponent);
  //   this.componentRef.instance.id = this.productId; 
  // }
    // this.displayedImages = this.imagesLook.slice(0, 3);
    // this._ActivatedRoute.paramMap.subscribe((params) => {
    //   this.productId = params.get('id');
    // });

    // 
    ///////////////get data for quik view dialog////////////////
    // this.parentData = this.productDetails;
    // this.responsiveOptions = [
    //   {
    //     breakpoint: '1024px',
    //     numVisible: 3,
    //     numScroll: 3
    //   },
    //   {
    //     breakpoint: '768px',
    //     numVisible: 2,
    //     numScroll: 2
    //   },
    //   {
    //     breakpoint: '560px',
    //     numVisible: 1,
    //     numScroll: 1
    //   }
    // ];
  


}