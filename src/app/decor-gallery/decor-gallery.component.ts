import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageModule } from 'primeng/image';
@Component({
  selector: 'app-decor-gallery',
  standalone: true,
  imports: [CommonModule, ImageModule],
  templateUrl: './decor-gallery.component.html',
  styleUrl: './decor-gallery.component.css'
})
export class DecorGalleryComponent {
  images = [
    { src: 'assets/images/decor/1.jpg', alt: 'Helping the community' },
    { src: 'assets/images/decor/2.jpg', alt: 'Children smiling' },
    { src: 'assets/images/decor/3.jpg', alt: 'Group volunteering' },
    { src: 'assets/images/decor/4.jpg', alt: 'Community event' },
    { src: 'assets/images/decor/5.jpg', alt: 'Happy kids' },
    { src: 'assets/images/decor/6.jpg', alt: 'Image 6' },
    { src: 'assets/images/decor/7.jpg', alt: 'Image 7' },
    { src: 'assets/images/decor/8.jpg', alt: 'Image 8' },
    { src: 'assets/images/decor/9.jpg', alt: 'Image 9' },
    { src: 'assets/images/decor/10.jpg', alt: 'Image 10' },
    { src: 'assets/images/decor/11.jpg', alt: 'Helping the community' },
    { src: 'assets/images/decor/12.jpg', alt: 'Children smiling' },
    { src: 'assets/images/decor/13.jpg', alt: 'Group volunteering' },
    { src: 'assets/images/decor/14.jpg', alt: 'Community event' },
    { src: 'assets/images/decor/15.jpg', alt: 'Happy kids' },
    { src: 'assets/images/decor/16.jpg', alt: 'Image 6' },
    { src: 'assets/images/decor/17.jpg', alt: 'Image 7' },
    { src: 'assets/images/decor/18.jpg', alt: 'Image 8' },
    // { src: 'assets/images/decor/21.jpg', alt: 'Image 19' },
    // { src: 'assets/images/decor/22.jpg', alt: 'Image 20' },
  ];
}
