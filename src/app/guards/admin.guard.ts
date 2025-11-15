import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('Admin Guard - Token:', token ? 'exists' : 'missing');
  console.log('Admin Guard - User:', user);
  
  if (!token || !user) {
    console.log('Admin Guard - Redirecting to login: No token or user');
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
  
  try {
    const userData = JSON.parse(user);
    console.log('Admin Guard - Parsed user data:', userData);
    console.log('Admin Guard - Role:', userData.role);
    console.log('Admin Guard - Role === ADMIN:', userData.role === 'ADMIN');
    
    if (userData.role === 'ADMIN') {
      console.log('Admin Guard - Access granted');
      return true;
    } else {
      console.log('Admin Guard - Access denied, redirecting to home');
      router.navigate(['/']);
      return false;
    }
  } catch (error) {
    console.log('Admin Guard - Error parsing user data:', error);
    router.navigate(['/login']);
    return false;
  }
};
