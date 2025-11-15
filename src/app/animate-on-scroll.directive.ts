import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[appAnimateOnScroll]',
  standalone: true
})
export class AnimateOnScrollDirective {
  @Input('appAnimateOnScroll') animationClass = 'animate__fadeInUp';


  constructor(private el: ElementRef) { }
  ngOnInit() {
    const element = this.el.nativeElement;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add('animate__animated', this.animationClass);
          observer.unobserve(element); // Only animate once
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
  }
}

