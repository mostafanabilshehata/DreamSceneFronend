import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { 
  Category, 
  Subcategory, 
  Item, 
  Partner, 
  Order, 
  OrderRequest,
  LoginRequest,
  LoginResponse,
  ApiResponse,
  SpecialOrder,
  SpecialOrderRequest
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  // Authentication
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(map(response => response.data!));
  }

  // Email Verification
  sendVerificationCode(email: string): Observable<string> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/verification/send-code`, { email })
      .pipe(map(response => response.message || 'Code sent'));
  }

  verifyCode(email: string, code: string): Observable<boolean> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/verification/verify-code`, { email, code })
      .pipe(map(response => response.data || false));
  }

  // Categories
  getAllCategories(): Observable<Category[]> {
    return this.http.get<ApiResponse<Category[]>>(`${this.apiUrl}/categories`)
      .pipe(map(response => response.data || []));
  }

  getCategoryById(id: number): Observable<Category> {
    return this.http.get<ApiResponse<Category>>(`${this.apiUrl}/categories/${id}`)
      .pipe(map(response => response.data!));
  }

  getCategoryWithSubcategories(id: number): Observable<Category> {
    return this.http.get<ApiResponse<Category>>(`${this.apiUrl}/categories/${id}/with-subcategories`)
      .pipe(map(response => response.data!));
  }

  // Subcategories
  getSubcategoriesByCategory(categoryId: number): Observable<Subcategory[]> {
    return this.http.get<ApiResponse<Subcategory[]>>(`${this.apiUrl}/categories/${categoryId}/subcategories`)
      .pipe(map(response => response.data || []));
  }

  getSubcategoryById(categoryId: number, subcategoryId: number): Observable<Subcategory> {
    return this.http.get<ApiResponse<Subcategory>>(`${this.apiUrl}/categories/${categoryId}/subcategories/${subcategoryId}`)
      .pipe(map(response => response.data!));
  }

  // Items
  getAllItems(): Observable<Item[]> {
    return this.http.get<ApiResponse<Item[]>>(`${this.apiUrl}/products`)
      .pipe(map(response => response.data || []));
  }

  getItemById(id: number): Observable<Item> {
    return this.http.get<ApiResponse<Item>>(`${this.apiUrl}/products/${id}`)
      .pipe(map(response => response.data!));
  }

  getItemsByCategory(categoryId: number): Observable<Item[]> {
    return this.http.get<ApiResponse<Item[]>>(`${this.apiUrl}/products`, {
      params: { categoryId: categoryId.toString() }
    }).pipe(map(response => response.data || []));
  }

  getItemsBySubcategory(subcategoryId: number): Observable<Item[]> {
    return this.http.get<ApiResponse<Item[]>>(`${this.apiUrl}/products`, {
      params: { subcategoryId: subcategoryId.toString() }
    }).pipe(map(response => response.data || []));
  }

  getItemsByAvailability(availability: string): Observable<Item[]> {
    return this.http.get<ApiResponse<Item[]>>(`${this.apiUrl}/products`, {
      params: { availability }
    }).pipe(map(response => response.data || []));
  }

  searchItems(keyword: string): Observable<Item[]> {
    return this.http.get<ApiResponse<Item[]>>(`${this.apiUrl}/products/search`, {
      params: { keyword }
    }).pipe(map(response => response.data || []));
  }

  // Partners
  getAllPartners(): Observable<Partner[]> {
    return this.http.get<ApiResponse<Partner[]>>(`${this.apiUrl}/partners`)
      .pipe(map(response => response.data || []));
  }

  getPartnerById(id: number): Observable<Partner> {
    return this.http.get<ApiResponse<Partner>>(`${this.apiUrl}/partners/${id}`)
      .pipe(map(response => response.data!));
  }

  getPartnersByCategory(category: string): Observable<Partner[]> {
    return this.http.get<ApiResponse<Partner[]>>(`${this.apiUrl}/partners/category/${category}`)
      .pipe(map(response => response.data || []));
  }

  createPartner(partner: Partial<Partner>): Observable<Partner> {
    return this.http.post<ApiResponse<Partner>>(
      `${this.apiUrl}/admin/partners`, 
      partner,
      { headers: this.getHeaders() }
    ).pipe(map(response => response.data!));
  }

  updatePartner(id: number, partner: Partial<Partner>): Observable<Partner> {
    return this.http.put<ApiResponse<Partner>>(
      `${this.apiUrl}/admin/partners/${id}`, 
      partner,
      { headers: this.getHeaders() }
    ).pipe(map(response => response.data!));
  }

  deletePartner(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/admin/partners/${id}`,
      { headers: this.getHeaders() }
    ).pipe(map(response => response.data!));
  }

  // Orders
  createOrder(orderRequest: OrderRequest): Observable<Order> {
    return this.http.post<ApiResponse<Order>>(`${this.apiUrl}/orders`, orderRequest)
      .pipe(map(response => response.data!));
  }

  getAllOrders(): Observable<Order[]> {
    return this.http.get<ApiResponse<Order[]>>(`${this.apiUrl}/admin/orders`, {
      headers: this.getHeaders()
    }).pipe(map(response => response.data || []));
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<ApiResponse<Order>>(`${this.apiUrl}/admin/orders/${id}`, {
      headers: this.getHeaders()
    }).pipe(map(response => response.data!));
  }

  getOrdersByEmail(email: string): Observable<Order[]> {
    return this.http.get<ApiResponse<Order[]>>(`${this.apiUrl}/orders/email/${email}`)
      .pipe(map(response => response.data || []));
  }

  getOrdersByPhone(phone: string): Observable<Order[]> {
    return this.http.get<ApiResponse<Order[]>>(`${this.apiUrl}/orders/phone/${phone}`)
      .pipe(map(response => response.data || []));
  }

  // Helper method to search by email or phone (auto-detect)
  searchOrders(searchTerm: string): Observable<Order[]> {
    // Check if it looks like an email (contains @)
    if (searchTerm.includes('@')) {
      return this.getOrdersByEmail(searchTerm);
    } else {
      // Assume it's a phone number
      return this.getOrdersByPhone(searchTerm);
    }
  }

  updateOrderStatus(id: number, status: string, rejectionReason?: string): Observable<Order> {
    const params = new URLSearchParams();
    params.set('status', status);
    
    return this.http.put<ApiResponse<Order>>(
      `${this.apiUrl}/admin/orders/${id}/status?${params.toString()}`,
      rejectionReason ? { rejectionReason } : {},
      { headers: this.getHeaders() }
    ).pipe(map(response => response.data!));
  }

  // Admin - Categories
  createCategory(category: Partial<Category>): Observable<Category> {
    return this.http.post<ApiResponse<Category>>(
      `${this.apiUrl}/admin/categories`,
      category,
      { headers: this.getHeaders() }
    ).pipe(map(response => response.data!));
  }

  updateCategory(id: number, category: Partial<Category>): Observable<Category> {
    return this.http.put<ApiResponse<Category>>(
      `${this.apiUrl}/admin/categories/${id}`,
      category,
      { headers: this.getHeaders() }
    ).pipe(map(response => response.data!));
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/admin/categories/${id}`,
      { headers: this.getHeaders() }
    ).pipe(map(() => undefined));
  }

  // Admin - Subcategories
  createSubcategory(subcategory: Partial<Subcategory>): Observable<Subcategory> {
    return this.http.post<ApiResponse<Subcategory>>(
      `${this.apiUrl}/admin/subcategories`,
      subcategory,
      { headers: this.getHeaders() }
    ).pipe(map(response => response.data!));
  }

  updateSubcategory(id: number, subcategory: Partial<Subcategory>): Observable<Subcategory> {
    return this.http.put<ApiResponse<Subcategory>>(
      `${this.apiUrl}/admin/subcategories/${id}`,
      subcategory,
      { headers: this.getHeaders() }
    ).pipe(map(response => response.data!));
  }

  deleteSubcategory(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/admin/subcategories/${id}`,
      { headers: this.getHeaders() }
    ).pipe(map(() => undefined));
  }

  // Admin - Items
  createItem(item: Partial<Item>): Observable<Item> {
    return this.http.post<ApiResponse<Item>>(
      `${this.apiUrl}/admin/products`,
      item,
      { headers: this.getHeaders() }
    ).pipe(map(response => response.data!));
  }

  updateItem(id: number, item: Partial<Item>): Observable<Item> {
    return this.http.put<ApiResponse<Item>>(
      `${this.apiUrl}/admin/products/${id}`,
      item,
      { headers: this.getHeaders() }
    ).pipe(map(response => response.data!));
  }

  deleteItem(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/admin/products/${id}`,
      { headers: this.getHeaders() }
    ).pipe(map(() => undefined));
  }

  // Special Orders
  createSpecialOrder(request: SpecialOrderRequest): Observable<SpecialOrder> {
    return this.http.post<ApiResponse<SpecialOrder>>(`${this.apiUrl}/special-orders`, request)
      .pipe(map(response => response.data!));
  }

  getUserSpecialOrders(email: string): Observable<SpecialOrder[]> {
    return this.http.get<ApiResponse<SpecialOrder[]>>(`${this.apiUrl}/special-orders/user/${email}`)
      .pipe(map(response => response.data || []));
  }

  getAllSpecialOrders(): Observable<SpecialOrder[]> {
    return this.http.get<ApiResponse<SpecialOrder[]>>(
      `${this.apiUrl}/admin/special-orders`,
      { headers: this.getHeaders() }
    ).pipe(map(response => response.data || []));
  }

  getSpecialOrderById(id: number): Observable<SpecialOrder> {
    return this.http.get<ApiResponse<SpecialOrder>>(
      `${this.apiUrl}/admin/special-orders/${id}`,
      { headers: this.getHeaders() }
    ).pipe(map(response => response.data!));
  }

  updateSpecialOrderStatus(id: number, status: string, adminNotes?: string): Observable<SpecialOrder> {
    return this.http.put<ApiResponse<SpecialOrder>>(
      `${this.apiUrl}/admin/special-orders/${id}/status`,
      { status, adminNotes },
      { headers: this.getHeaders() }
    ).pipe(map(response => response.data!));
  }

  deleteSpecialOrder(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/admin/special-orders/${id}`,
      { headers: this.getHeaders() }
    ).pipe(map(() => undefined));
  }
}
