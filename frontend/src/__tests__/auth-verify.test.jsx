import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import VerifyPage from '../views/auth/Verify.jsx';

const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('VerifyPage', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn();
    // Simulate email in URL
    const url = new URL(window.location.href);
    url.searchParams.set('email', 'user@example.com');
    window.history.pushState({}, '', url.toString());
  });

  it('shows error when code is not 6 digits', async () => {
    renderWithRouter(<VerifyPage />);

    fireEvent.change(screen.getByLabelText(/Doğrulama Kodu/i), {
      target: { value: '123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Hesabı Doğrula/i }));

    await waitFor(() => {
      expect(screen.getByText(/Lütfen 6 haneli doğrulama kodunu girin./i)).toBeInTheDocument();
    });
  });

  it('submits code and shows success on successful verification', async () => {
    renderWithRouter(<VerifyPage />);

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: 'OK' }),
    });

    fireEvent.change(screen.getByLabelText(/Doğrulama Kodu/i), {
      target: { value: '123456' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Hesabı Doğrula/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Hesap başarıyla doğrulandı! Yönlendiriliyorsunuz.../i),
      ).toBeInTheDocument();
    });
  });

  it('resends code successfully', async () => {
    renderWithRouter(<VerifyPage />);

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Resent' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'OK' }),
      });

    fireEvent.click(screen.getByRole('button', { name: /Kodu Tekrar Gönder/i }));

    await waitFor(() => {
      expect(screen.getByText(/Doğrulama kodu başarıyla gönderildi!/i)).toBeInTheDocument();
    });
  });
});
