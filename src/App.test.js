import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    authMessage: '',
    signInWithGoogle: jest.fn(),
    signInWithFacebook: jest.fn(),
    signInWithEmail: jest.fn(),
    createEmailAccount: jest.fn(),
  }),
}));

test('renders login screen when user is signed out', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  const headingElement = screen.getByText(/sign in to shopkeeper/i);
  expect(headingElement).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /continue with facebook/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});
