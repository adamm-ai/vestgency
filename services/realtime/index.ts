/**
 * Realtime Services - Barrel Export
 * ==================================
 * Real-time communication services using WebSocket
 */

// WebSocket Manager
export {
  WebSocketManager,
  wsManager,
  getWebSocketUrl,
} from './websocket';

// Re-export types
export type { } from './websocket';

// Default export
export { wsManager as default } from './websocket';
