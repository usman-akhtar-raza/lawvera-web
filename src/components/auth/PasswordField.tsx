'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  inputClassName?: string;
};

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ className, inputClassName, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className={`relative ${className || ''}`}>
        <input
          {...props}
          ref={ref}
          type={isVisible ? 'text' : 'password'}
          className={`${inputClassName || ''} pr-11`}
        />
        <button
          type="button"
          onClick={() => setIsVisible((value) => !value)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--text-muted)] transition hover:text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#d5b47f]"
          aria-label={isVisible ? 'Hide password' : 'Show password'}
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);

PasswordField.displayName = 'PasswordField';
