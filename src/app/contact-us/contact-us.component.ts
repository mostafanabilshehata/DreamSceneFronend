import { Component,HostListener, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
// import { NavComponent } from '../nav/nav.component';
import { NgClass } from '@angular/common';


@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.css'],
  standalone: true,
  imports: [ButtonModule,NgClass]
})
export class ContactUsComponent implements OnInit {
  scrolled: boolean = false;

  @HostListener ("window:scroll", [])
    onWindowScroll() {
        this.scrolled = window.scrollY > 30;
    }

  constructor() { }

  ngOnInit(): void {
  }

}
