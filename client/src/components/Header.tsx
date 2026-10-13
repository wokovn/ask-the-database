import React from 'react';
import type { HealthState } from '../types.js';

interface HeaderProps {
  health: HealthState;
  onResetSession: () => void;
  messageCount: number;
}

export const Header: React.FC<HeaderProps> = ({ health, onResetSession, messageCount }) => {
  return (
    <header className="app-header">
      <div className="brand">
        <h1>Ask the Database</h1>
        <span className="brand-badge">Shop PostgreSQL</span>
      </div>

      <div className="header-status">
        <div className="status-pill" title={health.error || 'Connection status'}>
          <span className={`status-dot ${health.connected ? 'online' : 'offline'}`} />
          <span>
            {health.connected
              ? `DB Connected (${health.latencyMs ?? 0}ms)`
              : 'DB Offline'}
          </span>
        </div>

        {messageCount > 0 && (
          <button className="btn-secondary" onClick={onResetSession}>
            Phiên mới
          </button>
        )}
      </div>
    </header>
  );
};
