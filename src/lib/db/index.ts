import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Get database URL from environment variables
const connectionString = process.env.DATABASE_URL;

// Validate database URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Initialize the database client with connection pooling
const client = postgres(connectionString, { 
  prepare: false, // Disable prepared statements for Vercel Postgres
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
});

export const db = drizzle(client, { 
  schema,
  logger: process.env.NODE_ENV === 'development', // Enable query logging in development
});
