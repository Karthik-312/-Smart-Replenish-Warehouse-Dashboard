import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';

function deriveWsUrl(): string {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;

  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase) {
    const url = new URL(apiBase);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = '/ws/websocket';
    return url.toString();
  }

  return 'ws://localhost:8080/ws/websocket';
}

const POLL_INTERVAL_MS = 30_000;

export function useWebSocket(onMessage: () => void) {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const wsUrl = deriveWsUrl();
    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe('/topic/inventory', () => {
          onMessageRef.current();
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, []);

  // Polling fallback when WebSocket is not connected
  useEffect(() => {
    if (connected) return;
    const id = setInterval(() => onMessageRef.current(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [connected]);

  return { connected };
}
