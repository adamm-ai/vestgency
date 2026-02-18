/**
 * useWebSocket Hook - React hook for WebSocket subscriptions
 * ===========================================================
 * Provides easy WebSocket integration in React components
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { wsManager, getWebSocketUrl } from '../services/realtime/websocket';

type EventHandlers = Record<string, (data: unknown) => void>;

interface UseWebSocketOptions {
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
  /** WebSocket URL (default: derived from API URL) */
  url?: string;
}

interface UseWebSocketReturn {
  /** Whether WebSocket is currently connected */
  isConnected: boolean;
  /** Current connection state */
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  /** Send a message to the server */
  send: (event: string, data: unknown) => void;
  /** Manually reconnect to the server */
  reconnect: () => void;
  /** Manually connect to the server */
  connect: () => void;
  /** Manually disconnect from the server */
  disconnect: () => void;
}

/**
 * Hook to subscribe to WebSocket events
 * @param events - Object mapping event names to callback functions
 * @param options - Configuration options
 * @returns WebSocket controls and status
 *
 * @example
 * ```tsx
 * const { isConnected, send } = useWebSocket({
 *   'notification:new': (data) => console.log('New notification:', data),
 *   'lead:updated': (data) => console.log('Lead updated:', data),
 * });
 * ```
 */
export function useWebSocket(
  events: EventHandlers = {},
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const { autoConnect = true, url } = options;

  const [isConnected, setIsConnected] = useState(wsManager.isConnected());
  const [connectionState, setConnectionState] = useState(wsManager.getState());

  // Store events in a ref to avoid re-subscribing on every render
  const eventsRef = useRef(events);
  eventsRef.current = events;

  // Subscribe to connection state changes
  useEffect(() => {
    const unsubscribe = wsManager.subscribe('connection_state', (data) => {
      const { state } = data as { state: typeof connectionState };
      setConnectionState(state);
      setIsConnected(state === 'connected');
    });

    // Initial state sync
    setConnectionState(wsManager.getState());
    setIsConnected(wsManager.isConnected());

    return unsubscribe;
  }, []);

  // Subscribe to events
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    // Subscribe to each event
    Object.entries(eventsRef.current).forEach(([event, handler]) => {
      const unsubscribe = wsManager.subscribe(event, handler);
      unsubscribes.push(unsubscribe);
    });

    // Cleanup on unmount
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [Object.keys(events).join(',')]); // Re-subscribe when event keys change

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && !wsManager.isConnected()) {
      const wsUrl = url || getWebSocketUrl();
      wsManager.connect(wsUrl);
    }

    // Don't disconnect on unmount - let other components use the connection
  }, [autoConnect, url]);

  const send = useCallback((event: string, data: unknown) => {
    wsManager.send(event, data);
  }, []);

  const reconnect = useCallback(() => {
    wsManager.reconnect();
  }, []);

  const connect = useCallback(() => {
    const wsUrl = url || getWebSocketUrl();
    wsManager.connect(wsUrl);
  }, [url]);

  const disconnect = useCallback(() => {
    wsManager.disconnect();
  }, []);

  return {
    isConnected,
    connectionState,
    send,
    reconnect,
    connect,
    disconnect,
  };
}

/**
 * Hook to subscribe to a single WebSocket event
 * @param event - Event name to subscribe to
 * @param callback - Callback function when event is received
 * @returns WebSocket controls and status
 *
 * @example
 * ```tsx
 * const { isConnected } = useWebSocketEvent('notification:new', (data) => {
 *   console.log('New notification:', data);
 * });
 * ```
 */
export function useWebSocketEvent<T = unknown>(
  event: string,
  callback: (data: T) => void
): UseWebSocketReturn {
  return useWebSocket({
    [event]: callback as (data: unknown) => void,
  });
}

export default useWebSocket;
