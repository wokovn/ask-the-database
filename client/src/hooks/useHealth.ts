import { useState, useEffect, useCallback } from 'react';
import type { HealthState } from '../types.js';

export function useHealth() {
  const [health, setHealth] = useState<HealthState>({
    connected: false,
    llmConfigured: false,
    loading: true,
  });

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (data.success && data.data) {
        setHealth({
          connected: data.data.database.connected,
          latencyMs: data.data.database.latencyMs,
          llmConfigured: data.data.llm.configured,
          error: data.data.database.error,
          loading: false,
        });
      } else {
        setHealth({
          connected: false,
          llmConfigured: false,
          error: data.error?.message || 'Database disconnected',
          loading: false,
        });
      }
    } catch (err) {
      setHealth({
        connected: false,
        llmConfigured: false,
        error: err instanceof Error ? err.message : 'Server unavailable',
        loading: false,
      });
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [checkHealth]);

  return { health, refetch: checkHealth };
}
