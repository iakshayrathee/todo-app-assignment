import { db } from '../src/lib/db';
import { users, todos } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Running migrations...');
  
  // Create users table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      approved BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create todos table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      completed BOOLEAN NOT NULL DEFAULT false,
      user_id INTEGER NOT NULL REFERENCES users(id),
      due_date TIMESTAMP,
      tags TEXT[],
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create indexes
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
  
  console.log('Database tables created successfully!');
  
  // Close the database connection
  process.exit(0);
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
