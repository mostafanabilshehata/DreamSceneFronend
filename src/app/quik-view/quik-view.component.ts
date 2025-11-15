import { Component,Input,HostListener  } from '@angular/core';
import{AnimateOnScrollDirective} from '../animate-on-scroll.directive';
import { CarouselModule } from 'primeng/carousel';

import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { SidebarModule } from 'primeng/sidebar';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-quik-view',
  standalone: true,
  imports: [NgClass, AnimateOnScrollDirective,ButtonModule,CarouselModule, SidebarModule , DividerModule],
  templateUrl: './quik-view.component.html',
  styleUrl: './quik-view.component.css'
})
export class QuikViewComponent {
   scrolled: boolean = false;
 sidebarVisible2: boolean = false;
}
