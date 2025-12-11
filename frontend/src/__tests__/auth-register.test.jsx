import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import RegisterPage from '../views/auth/Register.jsx';

const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn();
  });

  it('shows error when passwords do not match', async () => {
    renderWithRouter(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/Ad Soyad/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText(/E-posta Adresi/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^Şifre$/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/Şifreyi Onayla/i), {
      target: { value: 'different' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Hesap Oluştur/i }));

    await waitFor(() => {
      expect(screen.getByText(/Şifreler eşleşmiyor./i)).toBeInTheDocument();
    });
  });

  it('submits and shows success on successful registration', async () => {
    renderWithRouter(<RegisterPage />);

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: 'OK' }),
    });

    fireEvent.change(screen.getByLabelText(/Ad Soyad/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText(/E-posta Adresi/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^Şifre$/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/Şifreyi Onayla/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Hesap Oluştur/i }));

    await waitFor(() => {
      expect(screen.getByText(/OK/i)).toBeInTheDocument();
    });
  });
});
