import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/** HTTPS base of the inventory API (no path), e.g. https://stockpulse-api-haxr.onrender.com */
function deriveApiOrigin(): string {
  if (import.meta.env.VITE_API_ORIGIN) {
    return import.meta.env.VITE_API_ORIGIN.replace(/\/$/, '');
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase) {
    const url = new URL(apiBase);
    return url.origin;
  }
  return 'http://localhost:8080';
}

function createStompClient(): Client {
  const origin = deriveApiOrigin();

  // Production Render still exposes STOMP over SockJS at /ws (see /ws/info).
  // Raw brokerURL /ws/websocket does not match that unless the API adds a native endpoint.
  const useNative = import.meta.env.VITE_WS_NATIVE === 'true';

  if (useNative) {
    const wsUrl =
      import.meta.env.VITE_WS_URL ??
      `${origin.replace(/^http/, 'ws')}/stomp`;
    return new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });
  }

  const sockJsUrl = import.meta.env.VITE_SOCKJS_URL ?? `${origin}/ws`;

  return new Client({
    webSocketFactory: () => new SockJS(sockJsUrl),
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
  });
}

const POLL_INTERVAL_MS = 30_000;

export function useWebSocket(onMessage: () => void) {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const client = createStompClient();

    client.onConnect = () => {
      setConnected(true);
      client.subscribe('/topic/inventory', () => {
        onMessageRef.current();
      });
    };
    client.onDisconnect = () => setConnected(false);
    client.onStompError = () => setConnected(false);
    client.onWebSocketClose = () => setConnected(false);

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, []);

  useEffect(() => {
    if (connected) return;
    const id = setInterval(() => onMessageRef.current(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [connected]);

  return { connected };
}
