import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart2, Github, Linkedin, Twitter } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const frostedSurface = 'glass-panel backdrop-blur-xl border-soft';
const frostedSocialButton = 'p-2 rounded-full glass-panel hover:scale-105 transition';
const socialLinks = [
  { href: 'https://github.com', label: 'Github', Icon: Github },
  { href: 'https://linkedin.com', label: 'LinkedIn', Icon: Linkedin },
  { href: 'https://twitter.com', label: 'Twitter', Icon: Twitter },
];
const legalLinks = [
  { to: '/gizlilik', label: 'Gizlilik' },
  { to: '/kullanim', label: 'Kullanım' },
  { to: '/iletisim', label: 'İletişim' },
];

export default function MarketingLayout({ children }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [bizOpen, setBizOpen] = useState(false);
  const bizRef = useRef(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    function onDocClick(e) {
      if (bizRef.current && !bizRef.current.contains(e.target)) setBizOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const goToAuthTarget = () => {
    if (token) navigate('/dashboard');
    else navigate('/login');
  };

  return (
    <div className="min-h-screen theme-gradient text-body antialiased flex flex-col">
      <header className={`sticky top-0 z-40 ${frostedSurface} border-b border-soft`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link to="/" className="text-indigo-600 font-extrabold text-xl hover:text-indigo-700">
                BayKoç
              </Link>

              <div className="hidden md:flex items-center gap-2">
                <div
                  ref={bizRef}
                  className="relative"
                  onMouseEnter={() => setBizOpen(true)}
                  onMouseLeave={() => setBizOpen(false)}
                >
                  <button
                    className="px-3 py-1 rounded text-sm hover:bg-white/50"
                    aria-expanded={bizOpen}
                    aria-controls="biz-menu"
                  >
                    Biz kimiz
                  </button>

                  {bizOpen && (
                    <>
                      <div aria-hidden="true" className="absolute left-0 top-full w-44 h-1" />

                      <div
                        id="biz-menu"
                        className="absolute left-0 mt-1 w-44 card-surface rounded-lg ring-1 ring-black/5"
                      >
                        <Link
                          to="/hakkimizda"
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-white/30"
                        >
                          Hakkımızda
                        </Link>
                        <Link
                          to="/ekibimiz"
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-white/30"
                        >
                          Ekibimiz
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 -mr-1 sm:-mr-2 lg:-mr-4">
              <button
                onClick={goToAuthTarget}
                className="text-sm px-3 py-1 rounded-md text-slate-700 hover:bg-white/50"
              >
                Giriş Yap
              </button>

              <button
                onClick={() => navigate('/register')}
                className="hidden sm:inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-semibold btn-primary hover:scale-[1.02] transform transition"
              >
                Kayıt Ol
              </button>

              <ThemeToggle className="ml-1 shrink-0" />

              <button
                onClick={() => navigate('/register')}
                className="sm:hidden inline-flex items-center p-2 rounded-md btn-primary"
                aria-label="Kayıt Ol"
              >
                <BarChart2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">{children}</main>

      <footer className={`border-t border-soft ${frostedSurface}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-indigo-600">BayKoç</span>
            <nav className="flex gap-4 text-sm text-slate-600">
              {legalLinks.map(({ to, label }) => (
                <Link key={label} to={to} className="hover:text-indigo-700">
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-3">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className={frostedSocialButton}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>

            <div className="text-sm text-slate-500">© {currentYear} BayKoç</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
