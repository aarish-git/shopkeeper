import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    authMessage: '',
    signInWithGoogle: jest.fn(),
  }),
}));

test('renders login screen when user is signed out', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  const headingElement = screen.getByText(/sign in with google/i);
  expect(headingElement).toBeInTheDocument();
});
