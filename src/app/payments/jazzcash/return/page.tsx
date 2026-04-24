import { JazzCashReturnClient } from './JazzCashReturnClient';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function JazzCashReturnPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const bookingId = resolvedSearchParams.bookingId;
  const callbackStatus = resolvedSearchParams.status;

  return (
    <JazzCashReturnClient
      bookingId={typeof bookingId === 'string' ? bookingId : undefined}
      callbackStatus={
        typeof callbackStatus === 'string' ? callbackStatus : undefined
      }
    />
  );
}
