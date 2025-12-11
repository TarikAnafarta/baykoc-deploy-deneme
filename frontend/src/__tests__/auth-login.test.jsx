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

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn();
  });

  it('shows verification prompt when backend says account is inactive', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ message: 'Account is inactive.' }),
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
      expect(screen.getByText(/Hesabınız henüz doğrulanmamış/i)).toBeInTheDocument();
    });
  });
});
