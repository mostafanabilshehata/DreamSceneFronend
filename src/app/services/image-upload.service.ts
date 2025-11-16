import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment.prod';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  uploadImage(file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/admin/upload-image`, formData, { headers })
      .pipe(
        map(response => ({ imageUrl: response.data }))
      );
  }
  
  // Handle image file selection and preview
  handleImageSelect(event: any): Promise<{ file: File, preview: string }> {
    return new Promise((resolve, reject) => {
      const file = event.target.files[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          reject('Please select an image file');
          return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          reject('Image size should be less than 5MB');
          return;
        }
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          resolve({
            file: file,
            preview: e.target.result
          });
        };
        reader.onerror = () => reject('Failed to read file');
        reader.readAsDataURL(file);
      } else {
        reject('No file selected');
      }
    });
  }
}
