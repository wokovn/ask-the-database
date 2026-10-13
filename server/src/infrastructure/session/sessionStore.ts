export interface SessionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sql?: string | null;
  reasoning?: string;
  isAmbiguous?: boolean;
  isRefusal?: boolean;
  followUpQuestion?: string | null;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  messages: SessionMessage[];
  createdAt: number;
  lastActiveAt: number;
}

export interface ISessionStore {
  getSession(id: string): ChatSession | undefined;
  getOrCreateSession(id?: string): ChatSession;
  addMessage(sessionId: string, message: Omit<SessionMessage, 'id' | 'timestamp'>): SessionMessage;
  clearSession(sessionId: string): void;
}

export class InMemorySessionStore implements ISessionStore {
  private sessions = new Map<string, ChatSession>();
  private readonly ttlMs: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(ttlMs = 1800000) {
    this.ttlMs = ttlMs;
    // Periodic cleanup of stale sessions every 10 minutes
    this.cleanupInterval = setInterval(() => this.cleanupStaleSessions(), 600000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  public getSession(id: string): ChatSession | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    // Check if expired
    if (Date.now() - session.lastActiveAt > this.ttlMs) {
      this.sessions.delete(id);
      return undefined;
    }

    session.lastActiveAt = Date.now();
    return session;
  }

  public getOrCreateSession(id?: string): ChatSession {
    if (id) {
      const existing = this.getSession(id);
      if (existing) return existing;
    }

    const newId = id || this.generateId();
    const newSession: ChatSession = {
      id: newId,
      messages: [],
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };
    this.sessions.set(newId, newSession);
    return newSession;
  }

  public addMessage(
    sessionId: string,
    message: Omit<SessionMessage, 'id' | 'timestamp'>
  ): SessionMessage {
    const session = this.getOrCreateSession(sessionId);
    const fullMessage: SessionMessage = {
      ...message,
      id: this.generateId(),
      timestamp: Date.now(),
    };
    session.messages.push(fullMessage);
    session.lastActiveAt = Date.now();
    return fullMessage;
  }

  public clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  private cleanupStaleSessions(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastActiveAt > this.ttlMs) {
        this.sessions.delete(id);
      }
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
