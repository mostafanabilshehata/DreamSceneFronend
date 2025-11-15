import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService, Alert } from '../services/alert.service';

@Component({
  selector: 'app-alert-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-dialog.component.html',
  styleUrl: './alert-dialog.component.css'
})
export class AlertDialogComponent implements OnInit {
  alert: Alert | null = null;

  constructor(private alertService: AlertService) {}

  ngOnInit(): void {
    this.alertService.alert$.subscribe(alert => {
      if (alert.show) {
        this.alert = alert;
      } else {
        this.alert = null;
      }
    });
  }

  close(): void {
    this.alertService.hide();
  }

  getIcon(): string {
    switch (this.alert?.type) {
      case 'success': return 'fa-check-circle';
      case 'error': return 'fa-times-circle';
      case 'warning': return 'fa-exclamation-triangle';
      case 'info': return 'fa-info-circle';
      default: return 'fa-info-circle';
    }
  }
}
