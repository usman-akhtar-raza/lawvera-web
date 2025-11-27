import Link from 'next/link';
import { Briefcase } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#04081d] border-t border-white/10 text-[var(--text-secondary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Briefcase className="h-6 w-6 text-[#d5b47f]" />
              <span className="text-xl font-bold text-[var(--text-primary)]">
                Lawvera
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Your trusted platform for connecting with qualified legal
              professionals.
            </p>
          </div>
          <div>
            <h3 className="text-[var(--text-primary)] font-semibold mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/lawyers" className="hover:text-[#d5b47f]">
                  Find Lawyers
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-[#d5b47f]">
                  Become a Lawyer
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#d5b47f]">
                  About Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-[var(--text-primary)] font-semibold mb-4">
              Support
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="hover:text-[#d5b47f]">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-[#d5b47f]">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#d5b47f]">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-[var(--text-primary)] font-semibold mb-4">
              Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="hover:text-[#d5b47f]">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#d5b47f]">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-8 text-center text-xs text-[var(--text-muted)]">
          <p>&copy; {new Date().getFullYear()} Lawvera. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

