export type UserRole = 'ADMIN' | 'USER' | 'OWNER';

export interface User {
  id: string;
  name: string;
  email: string;
  address: string;
  role: UserRole;
  password?: string; // Excluded from client payloads
}

export interface Store {
  id: string;
  name: string;
  email: string;
  address: string;
  rating: number; // Average rating
  ownerId: string; // User ID of the owner
}

export interface Rating {
  id: string;
  userId: string;
  userName: string;
  storeId: string;
  rating: number; // 1 to 5
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalStores: number;
  totalRatings: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}
