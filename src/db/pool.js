import pg from 'pg';
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Please set the DATABASE_URL environment variable to your Supabase/Postgres connection string.');
}

const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
const ssl = isLocal ? false : { rejectUnauthorized: false };

export const pool = new Pool({
  connectionString,
  ssl
});

pool.on('connect', () => {
  console.log('✅ Connected to Supabase PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Postgres pool error:', err.message || err);
});
