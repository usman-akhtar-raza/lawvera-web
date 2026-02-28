'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Mail, Phone, X } from 'lucide-react';

type InfoTopic = 'about' | 'faq' | 'privacy' | 'terms';

type InfoSection = {
  title: string;
  body: string;
};

const infoContent: Record<InfoTopic, InfoSection> = {
  about: {
    title: 'About Lawvera',
    body: 'Lawvera helps people connect with verified legal professionals, book appointments, and get grounded assistant support through a single platform.',
  },
  faq: {
    title: 'Frequently Asked Questions',
    body: 'You can search lawyers by city and specialization, review profiles, and request appointments. Lawyer onboarding is reviewed before profiles are publicly listed.',
  },
  privacy: {
    title: 'Privacy Notice',
    body: 'Lawvera stores account and booking data to deliver platform services. We do not use uploaded legal books for public training and keep access limited by role.',
  },
  terms: {
    title: 'Terms of Service',
    body: 'Platform responses are informational and not a substitute for attorney-client advice. Use of Lawvera is subject to account policy, acceptable use, and local law.',
  },
};

const infoTabs: Array<{ id: InfoTopic; label: string }> = [
  { id: 'about', label: 'About' },
  { id: 'faq', label: 'FAQ' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'terms', label: 'Terms' },
];

export function Footer() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState<InfoTopic>('about');

  const activeSection = useMemo(() => infoContent[activeTopic], [activeTopic]);

  return (
    <>
      <footer className="border-t border-white/10 bg-[var(--surface)] text-[var(--text-secondary)]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-[#d5b47f]" />
              <span className="text-xl font-bold text-[var(--text-primary)]">
                Lawvera
              </span>
            </div>
            <p className="text-sm">
              Legal discovery, booking, and grounded assistance in one place.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-[var(--text-primary)]">
              Platform
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/lawyers" className="transition hover:text-[#b07a43]">
                  Find Lawyers
                </Link>
              </li>
              <li>
                <Link href="/auth/register?type=lawyer" className="transition hover:text-[#b07a43]">
                  Join as Lawyer
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTopic('about');
                    setIsInfoOpen(true);
                  }}
                  className="transition hover:text-[#b07a43]"
                >
                  About Lawvera
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-[var(--text-primary)]">
              Support
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#b07a43]" />
                support@lawvera.local
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#b07a43]" />
                +1 (000) 000-0000
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTopic('faq');
                    setIsInfoOpen(true);
                  }}
                  className="transition hover:text-[#b07a43]"
                >
                  Help Center
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-[var(--text-primary)]">
              Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTopic('terms');
                    setIsInfoOpen(true);
                  }}
                  className="transition hover:text-[#b07a43]"
                >
                  Terms
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTopic('privacy');
                    setIsInfoOpen(true);
                  }}
                  className="transition hover:text-[#b07a43]"
                >
                  Privacy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setIsInfoOpen(true)}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#b07a43] transition hover:border-[#d5b47f]/40 hover:bg-[var(--brand-accent-soft)]"
                >
                  Info Center
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-6 text-center text-xs text-[var(--text-muted)]">
          <p>&copy; {new Date().getFullYear()} Lawvera. All rights reserved.</p>
        </div>
      </footer>

      {isInfoOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsInfoOpen(false);
            }
          }}
        >
          <section
            aria-modal="true"
            role="dialog"
            aria-label="Lawvera information"
            className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[var(--surface)] shadow-2xl shadow-black/30"
          >
            <header className="flex items-center justify-between border-b border-white/10 bg-[var(--surface-muted)] px-5 py-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Information
              </p>
              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                className="rounded-full border border-white/10 p-1.5 text-[var(--text-muted)] transition hover:border-white/30 hover:text-[var(--text-primary)]"
                aria-label="Close information modal"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="space-y-5 p-5">
              <div className="flex flex-wrap gap-2">
                {infoTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTopic(tab.id)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                      activeTopic === tab.id
                        ? 'border-[#d5b47f]/50 bg-[var(--brand-accent-soft)] text-[#b07a43]'
                        : 'border-white/10 text-[var(--text-secondary)] hover:border-[#d5b47f]/35'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <h4 className="text-lg font-semibold text-[var(--text-primary)]">
                  {activeSection.title}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {activeSection.body}
                </p>
              </article>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
