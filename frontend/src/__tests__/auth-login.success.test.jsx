import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import LoginPage from '../views/auth/Login.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';

const renderWithRouter = (ui) =>
  render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>,
  );

describe('LoginPage success flow', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn();
  });

  it('stores token on successful login with completed profile', async () => {
    // first fetch: login
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ token: 'abc123' }),
      })
      // second fetch: /api/users/me/
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ profile_completed: true }),
      });

    renderWithRouter(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/E-posta Adresi/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Şifre/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Giriş Yap/i }));

    await waitFor(() => {
      expect(localStorage.getItem('authToken')).toBe('abc123');
    });
  });
});
