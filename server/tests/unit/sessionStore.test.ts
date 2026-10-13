import { describe, it, expect } from 'vitest';
import { InMemorySessionStore } from '../../src/infrastructure/session/sessionStore.js';

describe('InMemorySessionStore', () => {
  it('should create new session with unique ID', () => {
    const store = new InMemorySessionStore(60000);
    const session1 = store.getOrCreateSession();
    const session2 = store.getOrCreateSession();

    expect(session1.id).toBeDefined();
    expect(session2.id).toBeDefined();
    expect(session1.id).not.toBe(session2.id);
    expect(session1.messages).toHaveLength(0);
    store.destroy();
  });

  it('should retrieve existing session by ID and add messages', () => {
    const store = new InMemorySessionStore(60000);
    const session = store.getOrCreateSession('test-session');
    expect(session.id).toBe('test-session');

    store.addMessage('test-session', {
      role: 'user',
      content: 'Hello SQL',
    });

    const retrieved = store.getSession('test-session');
    expect(retrieved).toBeDefined();
    expect(retrieved?.messages).toHaveLength(1);
    expect(retrieved?.messages[0].content).toBe('Hello SQL');
    store.destroy();
  });

  it('should expire session after TTL', async () => {
    // TTL of 50ms
    const store = new InMemorySessionStore(50);
    store.getOrCreateSession('short-lived');

    // Wait 70ms
    await new Promise((resolve) => setTimeout(resolve, 70));

    const retrieved = store.getSession('short-lived');
    expect(retrieved).toBeUndefined();
    store.destroy();
  });
});
