import { createApp } from './app.js';
import { config } from './config/env.js';

// Global Process Error Handlers - Task 3: The app never crashes
process.on('uncaughtException', (err: Error) => {
  console.error('[UNCAUGHT EXCEPTION]:', err.stack || err.message);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('[UNHANDLED REJECTION]:', reason);
});

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`🚀 Ask-the-Database Server running on http://localhost:${config.port}`);
  console.log(`📊 PostgreSQL: ${config.databaseUrl.replace(/:[^:@]+@/, ':****@')}`);
  console.log(`🤖 Gemini Model: ${config.geminiModel} (Key: ${config.geminiApiKey ? 'Configured ✅' : 'Missing ⚠️'})`);
});

const gracefulShutdown = (signal: string) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
