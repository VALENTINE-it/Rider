import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

export const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const listenersRef = useRef(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);

  // Determine WebSocket URL
  const getWebSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use Vite proxy (/api/v1/ws) or explicit backend host
    if (window.location.port === '5173') {
      return `${protocol}//${window.location.host}/api/v1/ws`;
    }
    return `${protocol}//localhost:8080/api/v1/ws`;
  };

  const connect = useCallback(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const url = getWebSocketUrl();
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { event: eventName, data } = payload;
          if (eventName && listenersRef.current.has(eventName)) {
            const handlers = listenersRef.current.get(eventName);
            handlers.forEach((handler) => {
              try {
                handler(data);
              } catch (err) {
                console.error(`Error in WebSocket handler for ${eventName}:`, err);
              }
            });
          }
        } catch {
          // Non-JSON or ping message
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        socketRef.current = null;
        // Schedule reconnect after 3 seconds if still authenticated
        if (isAuthenticated) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    } catch {
      setIsConnected(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  // Subscribe to real-time events
  const subscribe = useCallback((eventName, handler) => {
    if (!listenersRef.current.has(eventName)) {
      listenersRef.current.set(eventName, new Set());
    }
    listenersRef.current.get(eventName).add(handler);

    return () => {
      if (listenersRef.current.has(eventName)) {
        listenersRef.current.get(eventName).delete(handler);
        if (listenersRef.current.get(eventName).size === 0) {
          listenersRef.current.delete(eventName);
        }
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    return { isConnected: false, subscribe: () => () => {} };
  }
  return context;
}
