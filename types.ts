export interface Trade {
    id: string;
    fromProduct: Product;
    toProduct: Product;
    message: string;
    status: 'pending' | 'accepted' | 'rejected' | 'canceled';
    createdAt: string;
    updatedAt?: string;
    fromUserRating?: number;
  }
  
  export interface Product {
    id: number;
    name: string;
    description: string;
    quality: string;
    tags: string[];
    value: number;
    city: string;
    state: string;
    images: string[];
    ownerEmail: string;
    ownerRating?: number;
    status: 'available' | 'traded';
  }
  
  export interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    profilePicture?: string;
    rating?: number;
    ratings?: number[];
    tradedItems?: Product[];
  }