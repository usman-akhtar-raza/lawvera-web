'use client';

import { useEffect, useRef, useState } from 'react';
import { CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-message';
import type { LegalCase, PayPalCardCheckoutConfig } from '@/types';

declare global {
  interface Window {
    paypal?: any;
  }
}

const PAYPAL_SCRIPT_ID = 'lawvera-paypal-card-sdk';

async function loadPayPalCardSdk(config: PayPalCardCheckoutConfig) {
  if (typeof window === 'undefined') {
    throw new Error('PayPal SDK can only load in the browser.');
  }

  const existing = document.getElementById(
    PAYPAL_SCRIPT_ID,
  ) as HTMLScriptElement | null;
  const existingKey = existing?.dataset.sdkKey;
  const nextKey = `${config.clientId}|${config.clientToken}|${config.currency}`;

  if (window.paypal && existing && existingKey === nextKey) {
    return;
  }

  if (existing) {
    existing.remove();
    delete window.paypal;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = PAYPAL_SCRIPT_ID;
    script.dataset.sdkKey = nextKey;
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      config.clientId,
    )}&components=buttons,card-fields&currency=${encodeURIComponent(
      config.currency,
    )}&intent=capture`;
    script.async = true;
    script.setAttribute('data-client-token', config.clientToken);
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('Failed to load the PayPal card checkout SDK.'));
    document.body.appendChild(script);
  });
}

type PayPalCardEscrowFormProps = {
  amount: string;
  caseId: string;
  currency: string;
  disabled?: boolean;
  onSuccess: (legalCase: LegalCase) => void;
};

export function PayPalCardEscrowForm({
  amount,
  caseId,
  currency,
  disabled = false,
  onSuccess,
}: PayPalCardEscrowFormProps) {
  const amountRef = useRef(amount);
  const cardFieldsRef = useRef<any>(null);
  const orderIdRef = useRef<string | null>(null);
  const [config, setConfig] = useState<PayPalCardCheckoutConfig | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  amountRef.current = amount;

  const fieldIdBase = `paypal-card-${caseId}`;
  const nameFieldId = `${fieldIdBase}-name`;
  const numberFieldId = `${fieldIdBase}-number`;
  const expiryFieldId = `${fieldIdBase}-expiry`;
  const cvvFieldId = `${fieldIdBase}-cvv`;

  useEffect(() => {
    let ignore = false;

    const loadConfig = async () => {
      setIsConfigLoading(true);
      try {
        const nextConfig = await api.getPayPalCardCheckoutConfig();
        if (!ignore) {
          setConfig(nextConfig);
          setInlineError(null);
        }
      } catch (error: unknown) {
        if (!ignore) {
          setInlineError(
            getErrorMessage(
              error,
              'Unable to initialize secure card checkout for this case.',
            ),
          );
        }
      } finally {
        if (!ignore) {
          setIsConfigLoading(false);
        }
      }
    };

    void loadConfig();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!config) {
      return;
    }

    let ignore = false;

    const renderCardFields = async () => {
      try {
        await loadPayPalCardSdk(config);
        if (ignore) {
          return;
        }

        const paypal = window.paypal;
        if (!paypal?.CardFields) {
          setInlineError(
            'Card checkout is not available on this PayPal app. Enable Expanded Credit and Debit Card Payments first.',
          );
          return;
        }

        const cardFields = paypal.CardFields({
          createOrder: async () => {
            const amountValue = Number(amountRef.current);
            if (!Number.isFinite(amountValue) || amountValue <= 0) {
              throw new Error(
                'Enter a valid agreed fee before submitting the card payment.',
              );
            }

            const session = await api.createCaseEscrowOrder(caseId, {
              amount: amountValue,
              checkoutMode: 'card',
            });
            orderIdRef.current = session.orderId;
            return session.orderId;
          },
          onApprove: async (data: { orderID?: string }) => {
            const orderId = data.orderID || orderIdRef.current;
            if (!orderId) {
              throw new Error(
                'PayPal did not return a valid card order reference.',
              );
            }

            const legalCase = await api.captureCaseEscrowOrder(caseId, orderId);
            orderIdRef.current = null;
            toast.success('Card payment captured and held in escrow.');
            onSuccess(legalCase);
          },
          onError: async (error: unknown) => {
            setInlineError(getErrorMessage(error, 'Card payment failed.'));
            if (orderIdRef.current) {
              try {
                await api.cancelCaseEscrowOrder(
                  caseId,
                  'Card checkout was interrupted before completion',
                );
              } catch {
                // Preserve the original error for the buyer.
              } finally {
                orderIdRef.current = null;
              }
            }
          },
          style: {
            input: {
              color: '#f8fafc',
              'font-size': '15px',
              'font-family': 'inherit',
            },
            '.invalid': {
              color: '#f87171',
            },
            '.valid': {
              color: '#f8fafc',
            },
          },
        });

        if (!cardFields.isEligible()) {
          setInlineError(
            'This merchant account is not eligible for PayPal advanced card fields in the current environment.',
          );
          return;
        }

        const fieldIds = [nameFieldId, numberFieldId, expiryFieldId, cvvFieldId];
        fieldIds.forEach((fieldId) => {
          const element = document.getElementById(fieldId);
          if (element) {
            element.innerHTML = '';
          }
        });

        await Promise.all([
          cardFields.NameField().render(`#${nameFieldId}`),
          cardFields.NumberField().render(`#${numberFieldId}`),
          cardFields.ExpiryField().render(`#${expiryFieldId}`),
          cardFields.CVVField().render(`#${cvvFieldId}`),
        ]);

        if (!ignore) {
          cardFieldsRef.current = cardFields;
          setIsSdkReady(true);
          setInlineError(null);
        }
      } catch (error: unknown) {
        if (!ignore) {
          setInlineError(
            getErrorMessage(error, 'Unable to load the secure card form.'),
          );
        }
      }
    };

    void renderCardFields();

    return () => {
      ignore = true;
      cardFieldsRef.current = null;
      setIsSdkReady(false);
    };
  }, [
    caseId,
    config,
    cvvFieldId,
    expiryFieldId,
    nameFieldId,
    numberFieldId,
    onSuccess,
  ]);

  const handleSubmit = async () => {
    const amountValue = Number(amountRef.current);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      toast.error('Enter a valid agreed fee before continuing.');
      return;
    }

    const cardFields = cardFieldsRef.current;
    if (!cardFields) {
      setInlineError('Secure card fields are not ready yet.');
      return;
    }

    setIsSubmitting(true);
    setInlineError(null);

    try {
      const state = await cardFields.getState?.();
      if (state && !state.isFormValid) {
        setInlineError('Complete the card form before submitting the payment.');
        return;
      }

      await cardFields.submit();
    } catch (error: unknown) {
      setInlineError(
        getErrorMessage(error, 'Card payment could not be submitted.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-4 rounded-2xl border border-[#d5b47f]/20 bg-[var(--surface-elevated)] p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-[#d5b47f]/15 p-2 text-[#d5b47f]">
          <CreditCard className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Pay the platform by credit or debit card
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Your card is collected in PayPal-hosted fields. Lawvera keeps 15%
            and holds the rest in escrow until the case is completed.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Cardholder name
          </p>
          <div
            id={nameFieldId}
            className="h-20 rounded-lg border border-white/10 bg-[var(--surface)] px-3"
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Card number
          </p>
          <div
            id={numberFieldId}
            className="h-20 rounded-lg border border-white/10 bg-[var(--surface)] px-3"
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Expiry
          </p>
          <div
            id={expiryFieldId}
            className="h-20 rounded-lg border border-white/10 bg-[var(--surface)] px-3"
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
            CVV
          </p>
          <div
            id={cvvFieldId}
            className="h-20 rounded-lg border border-white/10 bg-[var(--surface)] px-3"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || isSubmitting || isConfigLoading || !isSdkReady}
          className="inline-flex items-center gap-2 rounded-lg border border-[#d5b47f]/40 bg-[#d5b47f]/15 px-4 py-2 text-sm font-medium text-[#f3e2c1] disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              Pay {currency} by card
            </>
          )}
        </button>
        {isConfigLoading && (
          <span className="text-sm text-[var(--text-muted)]">
            Loading secure card form...
          </span>
        )}
      </div>

      {inlineError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {inlineError}
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
        By paying with your card, your payment data is processed by PayPal.
      </p>
    </div>
  );
}
