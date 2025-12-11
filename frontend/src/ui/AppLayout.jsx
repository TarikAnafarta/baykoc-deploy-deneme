import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

const TITLE_MAP = {
  '/': 'Ana Sayfa',
  '/dashboard': 'Panel',
  '/graph': 'Öğrenme Grafiği',
  '/analytics': 'Analitik',
  '/login': 'Giriş',
  '/register': 'Kayıt',
  '/verify': 'Doğrulama',
  '/complete-profile': 'Profil Tamamlama',
  '/forgot-password': 'Şifre Sıfırlama Talebi',
  '/reset-password': 'Şifre Yenileme',
  '/auth/google/callback': 'Google Girişi',
  '/profile': 'Profil',
  '/hakkimizda': 'Hakkımızda',
  '/ekibimiz': 'Ekibimiz',
  '/cerez-politikasi': 'Çerez Politikası',
  '/gizlilik': 'Gizlilik',
  '/kullanim': 'Kullanım Koşulları',
  '/iletisim': 'İletişim',
};

export default function AppLayout() {
  const location = useLocation();

  useEffect(() => {
    const baseTitle = TITLE_MAP[location.pathname] || 'BayKoç';
    document.title = `${baseTitle} | BayKoç`;
  }, [location.pathname]);

  return (
    <div data-testid="app-root" className="min-h-screen bg-app text-body transition-colors">
      <Outlet />
    </div>
  );
}
