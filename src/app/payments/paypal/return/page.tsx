import { PayPalReturnClient } from './PayPalReturnClient';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PayPalReturnPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const caseId = resolvedSearchParams.caseId;
  const token = resolvedSearchParams.token;
  const cancelled = resolvedSearchParams.cancelled;

  return (
    <PayPalReturnClient
      caseId={typeof caseId === 'string' ? caseId : undefined}
      orderId={typeof token === 'string' ? token : undefined}
      cancelled={cancelled === '1'}
    />
  );
}
