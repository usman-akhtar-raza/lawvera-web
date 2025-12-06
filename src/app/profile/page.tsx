'use client';

import Link from 'next/link';
import { Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useTheme } from '@/components/providers/ThemeProvider';

const themeOptions = [
  {
    value: 'light' as const,
    title: 'Light mode',
    description: 'Bright, editorial surfaces with champagne highlights.',
    icon: Sun,
  },
  {
    value: 'dark' as const,
    title: 'Dark mode',
    description: 'Deep midnight blues that match the original brand palette.',
    icon: Moon,
  },
];

export default function ProfileSettingsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { theme, setTheme, toggleTheme } = useTheme();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--background-muted)] flex items-center justify-center px-4 text-[var(--text-primary)]">
        <div className="brand-card max-w-md w-full p-8 text-center space-y-4">
          <h1 className="text-2xl font-semibold">Sign in to access settings</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Login to customize your account preferences and appearance.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] px-6 py-3 text-sm font-semibold text-[#1b1205] transition hover:opacity-90"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background-muted)] py-10 px-4 text-[var(--text-primary)]">
      <div className="max-w-4xl mx-auto space-y-6">
        <section className="brand-card p-6">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-[var(--text-secondary)] mt-2">
            Manage your account details and personalize your experience.
          </p>
        </section>

        <section className="brand-card p-6 space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Appearance</h2>
              <p className="text-sm text-[var(--text-muted)]">
                Toggle between light and dark modes or pick a style below.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={theme === 'dark'}
              onClick={toggleTheme}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition ${
                theme === 'dark' ? 'bg-[#1f3d36]' : 'bg-[#d5b47f]'
              }`}
            >
              <span
                className={`inline-flex h-7 w-7 transform items-center justify-center rounded-full bg-white shadow transition ${
                  theme === 'dark' ? 'translate-x-8' : 'translate-x-1'
                }`}
              >
                {theme === 'dark' ? (
                  <Moon className="h-4 w-4 text-[#1f3d36]" />
                ) : (
                  <Sun className="h-4 w-4 text-[#b07a43]" />
                )}
              </span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={`text-left rounded-2xl border p-4 transition ${
                    isActive
                      ? 'border-[#d5b47f] bg-[var(--brand-accent-soft)] shadow-lg shadow-[#d5b47f]/20'
                      : 'border-white/10 hover:border-[#d5b47f]/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-white px-3 py-2 text-[#b07a43] shadow">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold">{option.title}</p>
                      <p className="text-sm text-[var(--text-muted)]">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="brand-card p-6 space-y-4">
          <h2 className="text-xl font-semibold">Account overview</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-[var(--text-muted)]">Name</p>
              <p className="text-lg font-medium mt-1">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Email</p>
              <p className="text-lg font-medium mt-1">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Role</p>
              <p className="text-lg font-medium mt-1 text-[#b07a43]">
                {user?.role
                  ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                  : 'Client'}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Member since</p>
              <p className="text-lg font-medium mt-1">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : '—'}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

