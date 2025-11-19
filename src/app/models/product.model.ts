export interface Product {
    _id: string;
    title: string;
    imageCover: string;
    category: {
        name: string;
        _id: string;
    };
    subcategory?: string;
    price: number;
    ratingsAverage?: number;
    description?: string;
    
    // New fields for sale/rent functionality
    availability: 'sale' | 'rent' | 'both';
    salePrice?: number;
    rentPrice?: number;
    stockQuantity: number;
}

export interface CartItem {
    product: Product;
    count: number;
    price: number;
    type: 'sale' | 'rent';
}
