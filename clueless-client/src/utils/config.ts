// Configuration utilities for the client application

/**
 * Get the server URL for generating invite links
 * In production, this should be configured via environment variables
 * For development, it falls back to the current origin
 */
export const getServerUrl = (): string => {
  // Check for environment variable first (this would be set by Vite as VITE_SERVER_URL)
  const envServerUrl = import.meta.env.VITE_SERVER_URL;
  if (envServerUrl) {
    return envServerUrl;
  }
  
  // For development, use current origin
  // In a real deployment, you'd want to configure this properly
  return window.location.origin;
};

/**
 * Get the WebSocket URL for server connections
 * This would typically be different from the HTTP server URL
 */
export const getWebSocketUrl = (): string => {
  const envWsUrl = import.meta.env.VITE_WS_URL;
  if (envWsUrl) {
    return envWsUrl;
  }
  
  // Fallback logic for development
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
};