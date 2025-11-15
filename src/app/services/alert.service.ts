import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Alert {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  show: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertSubject = new BehaviorSubject<Alert>({
    type: 'info',
    title: '',
    message: '',
    show: false
  });

  alert$ = this.alertSubject.asObservable();

  success(title: string, message: string) {
    this.showAlert('success', title, message);
  }

  error(title: string, message: string) {
    this.showAlert('error', title, message);
  }

  info(title: string, message: string) {
    this.showAlert('info', title, message);
  }

  warning(title: string, message: string) {
    this.showAlert('warning', title, message);
  }

  private showAlert(type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) {
    this.alertSubject.next({ type, title, message, show: true });
  }

  hide() {
    const currentAlert = this.alertSubject.value;
    this.alertSubject.next({ ...currentAlert, show: false });
  }
}
