import { useEffect, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';

export default function BackendStatus() {
  const isFetching = useIsFetching();
  const hasPendingRequests = isFetching > 0;
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (!hasPendingRequests) {
      setIsSlow(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setIsSlow(true), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [hasPendingRequests]);

  if (!isSlow) return null;

  return (
    <aside className="backend-status" role="status">
      <div>
        <strong>Our backend server is waking up</strong>
        <p>
          The server may be sleeping after a period of inactivity. It can take some seconds to
          start. Please wait, we’ll retry automatically . 
        </p>
        {/* every 2 seconds until it responds.*/}
      </div>
    </aside>
  );
}
