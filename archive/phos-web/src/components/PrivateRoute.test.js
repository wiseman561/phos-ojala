import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute'; // Adjust path as necessary

// Mock component to render for authenticated users
const MockProtectedComponent = () => <div>Protected Page Content</div>;

// Mock component for the login page
const MockLoginComponent = () => <div>Login Page</div>;

describe('PrivateRoute Component', () => {
  const renderWithRouter = (ui, { route = '/', authStatus = false } = {}) => {
    // Mock localStorage for authentication check
    Storage.prototype.getItem = jest.fn(() => authStatus ? 'fakeToken' : null);

    window.history.pushState({}, 'Test page', route);

    return render(
      <Router>
        <Routes>
          <Route path="/login" element={<MockLoginComponent />} />
          <Route path="/protected" element={<PrivateRoute><MockProtectedComponent /></PrivateRoute>} />
          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </Router>
    );
  };

  it('renders the child component when user is authenticated', () => {
    const { getByText } = renderWithRouter(null, { route: '/protected', authStatus: true });
    expect(getByText('Protected Page Content')).toBeInTheDocument();
  });

  it('redirects to /login when user is not authenticated and tries to access a protected route', () => {
    const { getByText, queryByText } = renderWithRouter(null, { route: '/protected', authStatus: false });
    // Check if login page content is rendered
    expect(getByText('Login Page')).toBeInTheDocument();
    // Check that protected content is not rendered
    expect(queryByText('Protected Page Content')).toBeNull();
  });

  it('does not redirect if user is not authenticated and on a public route (e.g. /login itself)', () => {
    const { getByText, queryByText } = renderWithRouter(null, { route: '/login', authStatus: false });
    expect(getByText('Login Page')).toBeInTheDocument();
    expect(queryByText('Protected Page Content')).toBeNull(); 
  });
});

