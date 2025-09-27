import EchoLib from 'laravel-echo';
import Pusher from 'pusher-js';

// Attach to window for Laravel Echo debugging if needed
declare global {
  interface Window {
    Echo?: any;
    Pusher?: typeof Pusher;
  }
}

window.Pusher = Pusher;

export function createEcho() {
  const key = (import.meta as any).env.VITE_PUSHER_KEY || '';
  const host = window.location.hostname;

  if (!key) {
    console.warn('[echo] Missing VITE_PUSHER_KEY; real-time features are disabled.');
    return null;
  }

  const echo: any = new (EchoLib as any)({
    broadcaster: 'pusher',
    key,
    wsHost: host,
    wsPort: 6001,
    wssPort: 6001,
    forceTLS: false,
    encrypted: false,
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
    cluster: (import.meta as any).env.VITE_PUSHER_CLUSTER || 'mt1',
    // withCredentials for Laravel Sanctum if needed
    authorizer: (channel: any) => ({
      authorize: (socketId: string, callback: any) => {
        fetch('/broadcasting/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          credentials: 'include',
          body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
        })
          .then((res) => res.json())
          .then((data) => callback(false, data))
          .catch((err) => callback(true, err));
      },
    }),
  });

  window.Echo = echo;
  return echo;
}
