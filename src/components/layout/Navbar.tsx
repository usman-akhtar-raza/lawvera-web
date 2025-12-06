'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { UserRole } from '@/types';
import { Menu, X, User, LogOut, Settings, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { useTheme } from '@/components/providers/ThemeProvider';
export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const logoSrc = isDarkMode ? '/logo-dark.svg' : '/logo.svg';
  const navBackgroundClass = isDarkMode
    ? 'border-white/10 bg-[#080f2b]'
    : 'border-white/10 bg-[#fbf6ed]';
  const dropdownCardClass = isDarkMode
    ? 'bg-[#101a3c] text-[var(--text-primary)]'
    : 'bg-white text-[var(--text-secondary)]';
  const dropdownHoverClass = isDarkMode ? 'hover:bg-white/5' : 'hover:bg-[var(--brand-accent-soft)]';
  const themeToggleBtnClass = isDarkMode
    ? 'bg-[#101a3c] text-white hover:text-[#f3e2c1]'
    : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[#b07a43]';
  const mobileMenuBgClass = isDarkMode ? 'bg-[#050c26]' : 'bg-white/90';
  const mobileHoverClass = isDarkMode ? 'hover:bg-white/5' : 'hover:bg-[var(--brand-accent-soft)]';

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const getDashboardLink = () => {
    if (!user) return '/auth/login';
    if (user.role === UserRole.ADMIN) return '/dashboard/admin';
    if (user.role === UserRole.LAWYER) return '/dashboard/lawyer';
    return '/dashboard/client';
  };

  return (
    <nav className={`sticky top-0 z-50 ${navBackgroundClass} backdrop-blur-xl py-2`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 text-[var(--text-primary)]">
          <div className="flex items-center">
            <Image src={logoSrc} alt="Logo" width={199} height={50} />
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/lawyers"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                pathname === '/lawyers'
                  ? 'text-[#b07a43] bg-[var(--brand-accent-soft)] border border-[#d5b47f]/30 shadow-lg shadow-[#d5b47f]/10'
                  : 'text-[var(--text-secondary)] hover:text-[#b07a43]'
              }`}
            >
              Find Lawyers
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              className={`rounded-full border border-white/10 p-2 shadow-sm transition ${themeToggleBtnClass}`}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            {isAuthenticated ? (
              <>
                <Link
                  href={getDashboardLink()}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    pathname?.startsWith('/dashboard')
                      ? 'text-[#b07a43] bg-[var(--brand-accent-soft)] border border-[#d5b47f]/30 shadow-lg shadow-[#d5b47f]/10'
                      : 'text-[var(--text-secondary)] hover:text-[#b07a43]'
                  }`}
                >
                  Dashboard
                </Link>
                <div className="relative group">
                  <button className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:text-[#d5b47f]">
                    <User className="h-5 w-5" />
                    <span>{user?.name}</span>
                  </button>
                  <div
                    className={`absolute right-0 mt-2 w-56 rounded-xl border border-white/10 py-2 shadow-2xl shadow-[#d5b47f]/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all ${dropdownCardClass}`}
                  >
                    <Link
                      href="/profile"
                      className={`flex items-center px-4 py-2 text-sm transition-colors ${dropdownHoverClass}`}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${dropdownHoverClass}`}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[#d5b47f]"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 rounded-md text-sm font-semibold text-[#01030c] bg-gradient-to-r from-[#f3e2c1] via-[#e6c891] to-[#d5b47f] shadow-lg shadow-[#d5b47f]/20 hover:shadow-[#d5b47f]/40 transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-[var(--text-primary)]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className={`md:hidden border-t border-white/10 ${mobileMenuBgClass}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 text-[var(--text-secondary)]">
            <Link
              href="/lawyers"
              className={`block px-3 py-2 rounded-md text-base font-medium ${mobileHoverClass}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Find Lawyers
            </Link>
            <button
              type="button"
              onClick={() => {
                toggleTheme();
                setMobileMenuOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-base font-medium ${mobileHoverClass}`}
            >
              <span>
                {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              </span>
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-[#d5b47f]" />
              ) : (
                <Moon className="h-4 w-4 text-[#b07a43]" />
              )}
            </button>
            {isAuthenticated ? (
              <>
                <Link
                  href={getDashboardLink()}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${mobileHoverClass}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${mobileHoverClass}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile Settings
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${mobileHoverClass}`}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${mobileHoverClass}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="block px-3 py-2 rounded-md text-base font-semibold text-[#1b1408] bg-gradient-to-r from-[#f7e4c6] via-[#ebcca0] to-[#d5b47f]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

