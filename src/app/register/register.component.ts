import { Component, OnInit } from '@angular/core';
import {NgIf, CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup,FormControl, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports:[NgIf , CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
   providers:[AuthService]
})
export class RegisterComponent implements OnInit {

  registerForm: FormGroup = new FormGroup({
    name: new FormControl(null, [Validators.required, Validators.minLength(3)]),
    email: new FormControl(null, [Validators.required, Validators.email]),
    password: new FormControl(null, [Validators.required, Validators.pattern(/^[A-Z][a-z0-9]{5,10}$/)]),
    rePassword: new FormControl(null, [Validators.required, Validators.pattern(/^[A-Z][a-z0-9]{5,10}$/)]),
    phone: new FormControl(null, [Validators.pattern(/^01[0125][0-9]{8}$/)])

  })

  constructor(private _AuthService: AuthService, private _Router: Router) { }
  isLoading: boolean = false;
  apiErorr:string  = '';

  handelRegister(registerForm: FormGroup) {
    this.isLoading = true;
    console.log(registerForm.value);
    if (registerForm.valid) {
      this._AuthService.register(registerForm.value).subscribe({
        next: (response) => {
          if (response.message === 'success') {
            this.isLoading = false;
            this._Router.navigate(['/login'])

          }
        },
        error: (err) => {
        this.isLoading = false;
        this.apiErorr = err.error.errors.msg;
        

      }
      })
    }
  }


  ngOnInit(): void {
  }

}
