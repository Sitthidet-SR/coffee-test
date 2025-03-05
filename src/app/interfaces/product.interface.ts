export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: 'coffee' | 'tea' | 'dessert' | 'other';
  stock: number;
  images: string[];
  ratings: number;
  numReviews: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadResponse {
  message: string;
  images: string[];
} 