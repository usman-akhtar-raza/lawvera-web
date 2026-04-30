'use client';

import Link from 'next/link';
import {
  authTabActiveClass,
  authTabBaseClass,
  authTabIdleClass,
} from '@/lib/auth-form';

interface AuthRoleTabsProps {
  activeRole: 'client' | 'lawyer';
}

export function AuthRoleTabs({ activeRole }: AuthRoleTabsProps) {
  const tabs = [
    { href: '/auth/register', label: 'User', role: 'client' as const },
    {
      href: '/auth/register/lawyer',
      label: 'Lawyer',
      role: 'lawyer' as const,
    },
  ];

  return (
    <div
      className="mb-6 flex gap-2"
      role="tablist"
      aria-label="Choose account type to register"
    >
      {tabs.map((tab) => {
        const isActive = tab.role === activeRole;

        return (
          <Link
            key={tab.role}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? 'page' : undefined}
            className={`${authTabBaseClass} ${
              isActive ? authTabActiveClass : authTabIdleClass
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
