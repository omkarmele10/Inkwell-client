import { useEffect, useState } from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';

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

    if (event.action.type === 'error') {
      const error = event.query.state.error;
      if (!error?.response || error.response.status >= 500) {
        setHasConnectionError(true);
      }
    } else if (event.action.type === 'success') {
      setHasConnectionError(false);
    }
  }), [queryClient]);

  if (!isSlow && !hasConnectionError) return null;

  return (
    <aside className="backend-status" role="status">
      <div>
        <strong>Our backend server is waking up</strong>
        <p>
          The server may be sleeping after a period of inactivity. It can take up to a minute to
          start. Please wait; if the page still hasn’t loaded after a minute, refresh and try again.
        </p>
      </div>
      <button className="btn btn-sm" onClick={() => window.location.reload()}>
        Refresh page
      </button>
    </aside>
  );
}
