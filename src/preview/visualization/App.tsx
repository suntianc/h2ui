import { useState, useEffect } from 'react';
import { ComponentNode } from './ComponentNode';
import { initWebSocketClient, type WSClient } from '../client';

interface ComponentTree {
  name: string;
  tag: string;
  children: ComponentTree[];
  isRepeated?: boolean;
  repeatCount?: number;
}

export function App() {
  const [componentTree, setComponentTree] = useState<ComponentTree | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [lastReload, setLastReload] = useState<Date | null>(null);

  useEffect(() => {
    // Load initial component tree from parent window or localStorage
    const stored = localStorage.getItem('h2ui-component-tree');
    if (stored) {
      try {
        setComponentTree(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse component tree:', e);
      }
    }

    // Initialize WebSocket client
    const client: WSClient = initWebSocketClient({
      onConnect: () => setWsStatus('connected'),
      onDisconnect: () => setWsStatus('disconnected'),
      onReconnecting: () => setWsStatus('reconnecting'),
      onReload: (data) => {
        console.log('Reload triggered:', data);
        setLastReload(new Date());
        // Refresh component tree from localStorage
        const refreshed = localStorage.getItem('h2ui-component-tree');
        if (refreshed) {
          try {
            setComponentTree(JSON.parse(refreshed));
          } catch (e) {
            console.error('Failed to parse component tree from localStorage:', e);
          }
        }
      },
    });

    return () => {
      client.disconnect();
    };
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>h2ui Component Preview</h1>
        <div className={`ws-status ${wsStatus}`}>
          {wsStatus === 'connected' ? 'Live' : wsStatus === 'reconnecting' ? 'Reconnecting...' : 'Disconnected'}
        </div>
      </header>

      {lastReload && (
        <div className="reload-notification">
          Reloaded at {lastReload.toLocaleTimeString()}
        </div>
      )}

      <main className="component-tree">
        {componentTree ? (
          <ComponentNode
            node={componentTree}
            onSelect={setSelected}
            selected={selected ?? undefined}
          />
        ) : (
          <div className="empty-state">
            No component tree available. Run <code>h2ui convert</code> first.
          </div>
        )}
      </main>
    </div>
  );
}
