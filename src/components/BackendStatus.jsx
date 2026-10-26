import { useEffect, useState } from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';

function isBackendUnavailable(error) {
  return !error?.response || error.response.status >= 500;
}

export default function BackendStatus() {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching();
  const hasPendingRequests = isFetching > 0;
  const [isSlow, setIsSlow] = useState(false);
  const [hasConnectionError, setHasConnectionError] = useState(false);

  useEffect(() => {
    if (!hasPendingRequests) {
      setIsSlow(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setIsSlow(true), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [hasPendingRequests]);

  useEffect(() => queryClient.getQueryCache().subscribe((event) => {
    if (event.type !== 'updated') return;

    setHasConnectionError(queryClient.getQueryCache().getAll().some((query) => (
      query.state.status === 'error' && isBackendUnavailable(query.state.error)
    )));
  }), [queryClient]);

  useEffect(() => {
    if (!hasConnectionError) return undefined;

    const retryId = window.setInterval(() => {
      void queryClient.refetchQueries({
        type: 'active',
        predicate: (query) => query.state.status === 'error' && isBackendUnavailable(query.state.error),
      });
    }, 2000);

    return () => window.clearInterval(retryId);
  }, [hasConnectionError, queryClient]);

  if (!isSlow && !hasConnectionError) return null;

  return (
    <aside className="backend-status" role="status">
      <div>
        <strong>Our backend server is waking up</strong>
        <p>
          The server may be sleeping after a period of inactivity. It can take up to a minute to
          start. Please wait; we’ll retry automatically until it responds.
        </p>
      </div>
    </aside>
  );
}
