export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    address?: string;
    subdistrict?: string;
    district?: string;
    province?: string;
    postalCode?: string;
  };
  profileImage?: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserStats {
  totalUsers: number;
  verifiedUsers: number;
  adminUsers: number;
} 