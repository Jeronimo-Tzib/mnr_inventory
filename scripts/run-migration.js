const fs = require('fs');
const { Pool } = require('pg');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
      process.env[key.trim()] = values.join('=').trim();
    }
  });
}

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false }
  });

  try {
    const sql = fs.readFileSync(path.join(__dirname, '002-auth-and-categories.sql'), 'utf8');
    console.log('Running migration...');
    await pool.query(sql);
    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    pool.end();
  }
}

run();
