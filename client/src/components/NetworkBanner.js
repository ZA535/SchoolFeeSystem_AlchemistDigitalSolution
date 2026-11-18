import { useEffect, useState } from 'react';
import { NetworkMessage } from '../enums/messages.js';

export default function NetworkBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    const conn = navigator.connection;
    const checkSlow = () => {
      if (!conn) return;
      setSlow(
        conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g'
      );
    };
    checkSlow();
    conn?.addEventListener('change', checkSlow);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      conn?.removeEventListener('change', checkSlow);
    };
  }, []);

  if (!offline && !slow) return null;

  return (
    <div
      className={`network-banner ${offline ? 'network-banner--error' : ''}`}
      role="status"
    >
      {offline ? NetworkMessage.OFFLINE : NetworkMessage.SLOW_CONNECTION}
    </div>
  );
}
