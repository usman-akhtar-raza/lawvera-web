'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { UserRole } from '@/types';
import { Menu, X, User, LogOut, Settings, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { useTheme } from '@/components/providers/ThemeProvider';
import { getRoleDisplayName } from '@/lib/role-display';
import { getDashboardRouteForRole } from '@/lib/dashboard-route';
import { isAdminRole } from '@/lib/role-utils';
export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isLawyersRoute = pathname?.startsWith('/lawyers');
  const isCasesRoute = pathname?.startsWith('/cases');
  const isFeedRoute = pathname?.startsWith('/feed');
  const isLawyer = user?.role === UserRole.LAWYER;
  const hasAdminAccess = isAdminRole(user?.role);
  const isAdminUsersRoute = pathname?.startsWith('/dashboard/admin/users');
  const isDashboardRoute =
    pathname?.startsWith('/dashboard') && !isAdminUsersRoute;
  const hasCommunication =
    user?.role === UserRole.CLIENT || user?.role === UserRole.LAWYER;
  const hasFinances = user?.role === UserRole.CLIENT || user?.role === UserRole.LAWYER;
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
  const desktopNavLinkClass =
    'whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-all';
  const activeDesktopNavLinkClass =
    'border border-[#d5b47f]/30 bg-[var(--brand-accent-soft)] text-[#b07a43] shadow-lg shadow-[#d5b47f]/10';
  const inactiveDesktopNavLinkClass =
    'text-[var(--text-secondary)] hover:text-[#b07a43]';

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const getDashboardLink = () => {
    if (!user) return '/auth/login';
    return getDashboardRouteForRole(user.role);
  };

  return (
    <nav className={`sticky top-0 z-50 ${navBackgroundClass} backdrop-blur-xl py-2`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 text-[var(--text-primary)]">
          <div className="flex shrink-0 items-center">
            <Image
              src={logoSrc}
              alt="Logo"
              width={199}
              height={50}
              className="h-auto w-[158px] xl:w-[178px] 2xl:w-[199px]"
            />
          </div>

          <div className="hidden min-w-0 flex-1 items-center justify-end gap-1 xl:flex 2xl:gap-2">
            <Link
              href="/lawyers"
              className={`${desktopNavLinkClass} ${
                isLawyersRoute
                  ? activeDesktopNavLinkClass
                  : inactiveDesktopNavLinkClass
              }`}
            >
              Find Lawyers
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              className={`shrink-0 rounded-full border border-white/10 p-2 shadow-sm transition ${themeToggleBtnClass}`}
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
                  href="/cases"
                  className={`${desktopNavLinkClass} ${
                    isCasesRoute
                      ? activeDesktopNavLinkClass
                      : inactiveDesktopNavLinkClass
                  }`}
                >
                  Cases
                </Link>
                {isLawyer && (
                  <Link
                    href="/feed"
                    className={`${desktopNavLinkClass} ${
                      isFeedRoute
                        ? activeDesktopNavLinkClass
                        : inactiveDesktopNavLinkClass
                    }`}
                  >
                    Feed
                  </Link>
                )}
                {hasCommunication && (
                  <Link
                    href="/communication"
                    className={`${desktopNavLinkClass} ${
                      pathname?.startsWith('/communication')
                        ? activeDesktopNavLinkClass
                        : inactiveDesktopNavLinkClass
                    }`}
                  >
                    Communication
                  </Link>
                )}
                {hasFinances && (
                  <Link
                    href="/finances"
                    className={`${desktopNavLinkClass} ${
                      pathname?.startsWith('/finances')
                        ? activeDesktopNavLinkClass
                        : inactiveDesktopNavLinkClass
                    }`}
                  >
                    Finances
                  </Link>
                )}
                {hasAdminAccess && (
                  <Link
                    href="/dashboard/admin/users"
                    className={`${desktopNavLinkClass} ${
                      isAdminUsersRoute
                        ? activeDesktopNavLinkClass
                        : inactiveDesktopNavLinkClass
                    }`}
                  >
                    Users
                  </Link>
                )}
                <Link
                  href={getDashboardLink()}
                  className={`${desktopNavLinkClass} ${
                    isDashboardRoute
                      ? activeDesktopNavLinkClass
                      : inactiveDesktopNavLinkClass
                  }`}
                >
                  Dashboard
                </Link>
                <div className="relative shrink-0 group">
                  <button
                    aria-label="Open account menu"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[#d5b47f]"
                  >
                    <User className="h-5 w-5" />
                    <span className="hidden max-w-[9rem] truncate 2xl:inline">
                      {user?.name}
                    </span>
                    <span className="hidden rounded-full border border-[#d5b47f]/30 bg-[var(--brand-accent-soft)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#b07a43] 2xl:inline-flex">
                      {getRoleDisplayName(user?.role)}
                    </span>
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
                  className="whitespace-nowrap px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[#d5b47f]"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="navbar-signup-button whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold bg-gradient-to-r from-[#f3e2c1] via-[#e6c891] to-[#d5b47f] shadow-lg shadow-[#d5b47f]/20 hover:shadow-[#d5b47f]/40 transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button
            className="p-2 text-[var(--text-primary)] xl:hidden"
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
        <div className={`border-t border-white/10 xl:hidden ${mobileMenuBgClass}`}>
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
                  href="/cases"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${mobileHoverClass}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Cases
                </Link>
                {isLawyer && (
                  <Link
                    href="/feed"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${mobileHoverClass}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Feed
                  </Link>
                )}
                {hasCommunication && (
                  <Link
                    href="/communication"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${mobileHoverClass}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Communication
                  </Link>
                )}
                {hasFinances && (
                  <Link
                    href="/finances"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${mobileHoverClass}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Finances
                  </Link>
                )}
                {hasAdminAccess && (
                  <Link
                    href="/dashboard/admin/users"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${mobileHoverClass}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Users
                  </Link>
                )}
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
                  className="navbar-signup-button block px-3 py-2 rounded-md text-base font-semibold bg-gradient-to-r from-[#f7e4c6] via-[#ebcca0] to-[#d5b47f]"
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
