import { Component,Input,HostListener  } from '@angular/core';
import{AnimateOnScrollDirective} from '../animate-on-scroll.directive';
import { NgClass, CommonModule } from '@angular/common';

@Component({
  selector: 'app-quik-view',
  standalone: true,
  imports: [NgClass, CommonModule, AnimateOnScrollDirective],
  templateUrl: './quik-view.component.html',
  styleUrl: './quik-view.component.css'
})
export class QuikViewComponent {
   scrolled: boolean = false;
 sidebarVisible2: boolean = false;
}
