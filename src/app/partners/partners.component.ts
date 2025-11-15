import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { Partner } from '../models/api.models';

@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './partners.component.html',
  styleUrl: './partners.component.css'
})
export class PartnersComponent implements OnInit {
  partners: Partner[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadPartners();
  }

  loadPartners(): void {
    this.apiService.getAllPartners().subscribe({
      next: (partners) => {
        this.partners = partners;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading partners:', err);
        this.error = 'Failed to load partners';
        this.loading = false;
      }
    });
  }
}
