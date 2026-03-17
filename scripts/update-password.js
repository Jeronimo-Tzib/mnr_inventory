/**
 * Update a user's password in the inventory system.
 * 
 * Usage:
 *   node scripts/update-password.js <username> <new_password>
 * 
 * Examples:
 *   node scripts/update-password.js admin MyNewSecurePassword123
 *   node scripts/update-password.js employee EmployeePass456
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: 'postgresql://postgres:skywalker@localhost:5432/inventory_db',
  ssl: false,
  connectionTimeoutMillis: 5000,
});

async function updatePassword(username, newPassword) {
  if (!username || !newPassword) {
    console.error('Usage: node scripts/update-password.js <username> <new_password>');
    process.exit(1);
  }

  const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');

  try {
    const { rowCount } = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE username = $2',
      [hashedPassword, username]
    );

    if (rowCount === 0) {
      console.error(`Error: User "${username}" not found in the database.`);
    } else {
      console.log(`Success! Password updated for user "${username}".`);
      console.log(`New password: ${newPassword}`);
    }
  } catch (err) {
    console.error('Database error:', err.message);
  } finally {
    await pool.end();
  }
}

const [,, username, ...passwordParts] = process.argv;
const newPassword = passwordParts.join(' ');
updatePassword(username, newPassword);
