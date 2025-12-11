import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './ui/AppLayout';
import Home from './views/home/Home';
import Dashboard from './views/home/Dashboard';
import Login from './views/auth/Login';
import Register from './views/auth/Register';
import Verify from './views/auth/Verify';
import CompleteProfile from './views/auth/CompleteProfile';
import GraphPage from './views/graph/Graph';
import ProfilePage from './views/settings/Profile';
import Hakkimizda from './views/about/Hakkimizda';
import Ekibimiz from './views/team/Ekibimiz';
import ForgotPasswordPage from './views/auth/ForgotPassword';
import ResetPasswordPage from './views/auth/ResetPassword';
import CookiePolicyPage from './views/legal/CookiePolicy';
import GizlilikPage from './views/legal/Gizlilik';
import KullanimKosullariPage from './views/legal/Kullanim';
import IletisimPage from './views/legal/Iletisim';
import Analytics from './views/analytics/Analytics';
import GoogleCallback from './views/auth/GoogleCallback';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/graph" element={<GraphPage />} />
          <Route path="/analytics" element={<Analytics />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />

          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/hakkimizda" element={<Hakkimizda />} />
          <Route path="/ekibimiz" element={<Ekibimiz />} />
          <Route path="/cerez-politikasi" element={<CookiePolicyPage />} />
          <Route path="/gizlilik" element={<GizlilikPage />} />
          <Route path="/kullanim" element={<KullanimKosullariPage />} />
          <Route path="/iletisim" element={<IletisimPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
