export const authInputClass =
  'appearance-none block w-full px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-white/10 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#d5b47f] sm:text-sm';

export const authLabelClass =
  'block text-sm font-medium text-[var(--text-secondary)]';

export const authErrorClass = 'mt-1 text-sm text-red-500';

export const authSubmitButtonClass =
  'w-full flex justify-center py-2 px-4 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] hover:shadow-lg hover:shadow-[#d5b47f]/40 disabled:opacity-50 disabled:cursor-not-allowed';

export const authTabBaseClass =
  'flex-1 text-center py-2 rounded-lg border transition-colors';

export const authTabIdleClass =
  'bg-white/5 text-[var(--text-secondary)] border-white/10';

export const authTabActiveClass =
  'auth-tab-selected bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] border-transparent text-[#1b1205]';

export const phonePattern = /^\+?[0-9()\s-]{7,20}$/;
