export interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  createdAt?: Date;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: number;
  name: string;
  imageUrl?: string;
  categoryId: number;
  createdAt?: Date;
}

export interface Item {
  id: number;
  name: string;
  description?: string;
  salePrice?: number;
  rentPrice?: number;
  availability: 'SALE' | 'RENT' | 'BOTH';
  imageCover?: string;
  rating?: number;
  stockQuantity?: number;
  categoryId: number;
  subcategoryId: number;
  createdAt?: Date;
  images?: ItemImage[];
}

export interface ItemImage {
  id: number;
  imageUrl: string;
  itemId: number;
}

export interface Partner {
  id: number;
  title: string;
  category: string;
  description?: string;
  icon: string;
  imageUrl?: string;
  since?: string;
  rating?: string;
  gradient?: string;
  createdAt?: Date;
}

export interface Order {
  id: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  totalAmount: number;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  rejectionReason?: string;
  items: OrderItem[];
  createdAt?: Date;
}

export interface OrderItem {
  id?: number;
  itemId: number;
  itemName: string;
  quantity: number;
  price: number;
  type: 'SALE' | 'RENT';
  rentDays?: number;
}

export interface OrderRequest {
  userName: string;
  userEmail: string;
  userPhone: string;
  items: {
    itemId: number;
    quantity: number;
    type: 'SALE' | 'RENT';
    rentDays?: number;
  }[];
}

// Basket/Cart models for frontend
export interface BasketItem {
  item: Item;
  quantity: number;
  type: 'SALE' | 'RENT';
  rentDays?: number;
}

export interface Basket {
  items: BasketItem[];
  totalItems: number;
  totalAmount: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  email: string;
  role: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface SpecialOrder {
  id: number;
  userName: string;
  userEmail: string;
  description: string;
  imageUrls?: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  createdAt: Date;
  adminNotes?: string;
}

export interface SpecialOrderRequest {
  userName: string;
  userEmail: string;
  description: string;
  imageUrls?: string;
}
