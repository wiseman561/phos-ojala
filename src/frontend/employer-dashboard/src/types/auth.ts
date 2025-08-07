export interface User {
  id: string;
  email: string;
  role: 'employer' | 'admin' | 'provider' | 'patient';
  firstName: string;
  lastName: string;
  organizationId: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: Omit<User, 'id'>) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
} 