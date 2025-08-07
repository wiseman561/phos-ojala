import { User } from '../types/index';

const mockUser: User = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'employer'
};

const useAuth = () => {
  return {
    isAuthenticated: true,
    user: mockUser,
    login: jest.fn(),
    logout: jest.fn(),
    loading: false,
    error: null
  };
};

export default useAuth; 