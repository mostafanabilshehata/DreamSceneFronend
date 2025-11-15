import { Component, OnInit } from '@angular/core';
import { NgIf ,CommonModule } from '@angular/common';
import { jwtDecode } from 'jwt-decode';
import { Routes, RouterLink, RouterOutlet, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup,FormControl, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from '../services/api.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  standalone: true,
   imports:[NgIf , CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
   providers:[ApiService]
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup = new FormGroup({
    username: new FormControl(null, [Validators.required]),
    password: new FormControl(null, [Validators.required, Validators.minLength(3)]),

  })

  constructor(private apiService: ApiService, private router: Router) { }
  isLoading: boolean = false;
  apiErorr: string = '';
  handelLogin(loginForm: FormGroup) {
    this.isLoading = true;
    console.log('Login attempt with:', loginForm.value);
    
    if (loginForm.valid) {
      this.apiService.login(loginForm.value).subscribe({
        next: (response) => {
          console.log('Login response:', response);
          // Save token and user data to localStorage
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify({
            username: response.username,
            email: response.email,
            role: response.role
          }));
          
          this.isLoading = false;
          
          // Redirect based on role
          if (response.role === 'ADMIN') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/home']);
          }
        },
        error: (err) => {
          console.error('Login error:', err);
          this.isLoading = false;
          this.apiErorr = err.error?.message || 'Login failed. Please check your credentials.';
        }
      })
    }
  }
  ngOnInit(): void {
  }
}
