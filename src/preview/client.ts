export interface WSClientOptions {
  url?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReconnecting?: () => void;
  onReload?: (data: { type: string; file: string }) => void;
  maxRetries?: number;
  retryInterval?: number;
}

export interface WSClient {
  disconnect: () => void;
}

export function initWebSocketClient(options: WSClientOptions = {}): WSClient {
  const {
    url = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/__h2ui_preview_ws`,
    onConnect,
    onDisconnect,
    onReconnecting,
    onReload,
    maxRetries = 5,
    retryInterval = 1000,
  } = options;

  let ws: WebSocket | null = null;
  let retries = 0;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  function connect() {
    try {
      ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('[preview-client] Connected');
        retries = 0;
        onConnect?.();
      };

      ws.onclose = () => {
        console.log('[preview-client] Disconnected');
        onDisconnect?.();
        scheduleReconnect();
      };

      ws.onerror = (err) => {
        console.warn('[preview-client] Error:', err);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'reload') {
            console.log('[preview-client] Reload event:', data);
            onReload?.(data);
          }
        } catch (e) {
          console.warn('[preview-client] Failed to parse message:', e);
        }
      };
    } catch (e) {
      console.warn('[preview-client] Failed to create WebSocket:', e);
      scheduleReconnect();
    }
  }

  function scheduleReconnect() {
    if (retries >= maxRetries) {
      console.log('[preview-client] Max retries reached, giving up');
      return;
    }

    retries++;
    onReconnecting?.();

    // Exponential backoff with jitter
    const delay = retryInterval * Math.pow(2, retries - 1) + Math.random() * 1000;
    console.log(`[preview-client] Reconnecting in ${delay}ms (attempt ${retries}/${maxRetries})`);

    reconnectTimeout = setTimeout(connect, delay);
  }

  function disconnect() {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (ws) {
      ws.close();
      ws = null;
    }
  }

  connect();

  return { disconnect };
}
