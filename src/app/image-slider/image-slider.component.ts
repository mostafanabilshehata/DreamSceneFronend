import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GetImagesService } from '../services/get-images.service';
import { HttpClientModule } from '@angular/common/http';
@Component({
  selector: 'app-image-slider',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './image-slider.component.html',
  styleUrls: ['./image-slider.component.css']
})
export class ImageSliderComponent implements OnInit {
  responsiveOptions:any=[]
  images:any[]=[];
  constructor(private _getImagesServices:GetImagesService) { }

  ngOnInit(): void {
  
    this._getImagesServices.getProducts().subscribe({
      next:(response) => this.images = response.data
    })

    this.responsiveOptions = [
      {
          breakpoint: '1024px',
          numVisible: 3,
          numScroll: 3
      },
      {
          breakpoint: '768px',
          numVisible: 2,
          numScroll: 2
      },
      {
          breakpoint: '560px',
          numVisible: 1,
          numScroll: 1
      }
  ];
  }

}
