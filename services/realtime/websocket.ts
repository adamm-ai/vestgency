/**
 * WebSocket Manager - Real-time communication service
 * ====================================================
 * Handles WebSocket connections with auto-reconnect and event subscription
 */

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';
type EventCallback = (data: unknown) => void;

interface QueuedMessage {
  event: string;
  data: unknown;
  timestamp: number;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private url: string = '';
  private state: ConnectionState = 'disconnected';
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private messageQueue: QueuedMessage[] = [];
  private maxQueueSize = 100;

  /**
   * Connect to WebSocket server
   * @param url - WebSocket server URL (ws:// or wss://)
   */
  connect(url: string): void {
    if (this.ws && this.state === 'connected') {
      console.warn('[WebSocket] Already connected');
      return;
    }

    this.url = url;
    this.state = 'connecting';
    this.emitStateChange();

    try {
      this.ws = new WebSocket(url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.state = 'error';
      this.emitStateChange();
      this.handleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.clearTimers();
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.state = 'disconnected';
    this.emitStateChange();
  }

  /**
   * Send a message to the server
   * @param event - Event name
   * @param data - Data to send
   */
  send(event: string, data: unknown): void {
    const message = JSON.stringify({ event, data, timestamp: Date.now() });

    if (this.ws && this.state === 'connected') {
      try {
        this.ws.send(message);
      } catch (error) {
        console.error('[WebSocket] Send error:', error);
        this.queueMessage(event, data);
      }
    } else {
      // Queue message for later delivery
      this.queueMessage(event, data);
    }
  }

  /**
   * Subscribe to an event
   * @param event - Event name to subscribe to
   * @param callback - Callback function when event is received
   * @returns Unsubscribe function
   */
  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.eventListeners.delete(event);
        }
      }
    };
  }

  /**
   * Check if connected to server
   */
  isConnected(): boolean {
    return this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Manually trigger reconnection
   */
  reconnect(): void {
    this.reconnectAttempts = 0;
    this.disconnect();
    if (this.url) {
      this.connect(this.url);
    }
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('[WebSocket] Connected');
      this.state = 'connected';
      this.reconnectAttempts = 0;
      this.emitStateChange();
      this.flushMessageQueue();
      this.startHeartbeat();
    };

    this.ws.onclose = (event) => {
      console.log('[WebSocket] Disconnected:', event.code, event.reason);
      this.clearTimers();

      if (event.code !== 1000) {
        // Abnormal closure - attempt reconnect
        this.state = 'disconnected';
        this.emitStateChange();
        this.handleReconnect();
      } else {
        this.state = 'disconnected';
        this.emitStateChange();
      }
    };

    this.ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
      this.state = 'error';
      this.emitStateChange();
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(rawData: string): void {
    try {
      const message = JSON.parse(rawData);
      const { event, data } = message;

      if (event === 'pong') {
        // Heartbeat response - ignore
        return;
      }

      // Emit to all subscribers of this event
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.forEach((callback) => {
          try {
            callback(data);
          } catch (error) {
            console.error(`[WebSocket] Error in event handler for "${event}":`, error);
          }
        });
      }

      // Also emit to wildcard listeners
      const wildcardListeners = this.eventListeners.get('*');
      if (wildcardListeners) {
        wildcardListeners.forEach((callback) => {
          try {
            callback({ event, data });
          } catch (error) {
            console.error('[WebSocket] Error in wildcard handler:', error);
          }
        });
      }
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
    }
  }

  /**
   * Handle automatic reconnection with exponential backoff
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached');
      this.state = 'error';
      this.emitStateChange();
      this.emitEvent('max_reconnect_reached', { attempts: this.reconnectAttempts });
      return;
    }

    this.reconnectAttempts++;

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      if (this.url) {
        this.connect(this.url);
      }
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send('ping', { timestamp: Date.now() });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Queue a message for later delivery
   */
  private queueMessage(event: string, data: unknown): void {
    if (this.messageQueue.length >= this.maxQueueSize) {
      // Remove oldest message
      this.messageQueue.shift();
    }
    this.messageQueue.push({ event, data, timestamp: Date.now() });
  }

  /**
   * Send all queued messages
   */
  private flushMessageQueue(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    // Filter out old messages
    const validMessages = this.messageQueue.filter(
      (msg) => now - msg.timestamp < maxAge
    );

    this.messageQueue = [];

    // Send valid messages
    validMessages.forEach((msg) => {
      this.send(msg.event, msg.data);
    });
  }

  /**
   * Emit state change event
   */
  private emitStateChange(): void {
    this.emitEvent('connection_state', { state: this.state });
  }

  /**
   * Emit an event to subscribers
   */
  private emitEvent(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[WebSocket] Error in event handler for "${event}":`, error);
        }
      });
    }
  }
}

// Singleton instance
export const wsManager = new WebSocketManager();

// Helper function to get WebSocket URL from API URL
export function getWebSocketUrl(apiUrl?: string): string {
  const baseUrl = apiUrl || import.meta.env.VITE_API_URL || 'https://vestate-api-fisw.onrender.com';

  // Convert http(s) to ws(s)
  return baseUrl.replace(/^http/, 'ws') + '/ws';
}

export default wsManager;
