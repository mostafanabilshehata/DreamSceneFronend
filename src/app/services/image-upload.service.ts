import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {

  constructor(private http: HttpClient) {}

  uploadImage(file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', environment.cloudinaryUploadPreset);
    formData.append('folder', 'dreamscene');

    return this.http
      .post<any>(
        `https://api.cloudinary.com/v1_1/${environment.cloudinaryCloudName}/image/upload`,
        formData
      )
      .pipe(map((response) => ({ imageUrl: response.secure_url as string })));
  }

  handleImageSelect(event: any): Promise<{ file: File; preview: string }> {
    return new Promise((resolve, reject) => {
      const file: File = event.target.files[0];
      if (!file) return reject('No file selected');
      if (!file.type.startsWith('image/')) return reject('Please select an image file');
      if (file.size > 5 * 1024 * 1024) return reject('Image size should be less than 5MB');

      const reader = new FileReader();
      reader.onload = (e: any) => resolve({ file, preview: e.target.result });
      reader.onerror = () => reject('Failed to read file');
      reader.readAsDataURL(file);
    });
  }
}


