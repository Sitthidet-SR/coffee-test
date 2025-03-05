export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: string[];
  ratings: number;
  numReviews: number;
  category: string;
} 