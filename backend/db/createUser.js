/**
 * Create (or reset the password of) a login user.
 *
 *   npm run create-user -- <username> <password>
 *
 * Creates the `userschema` table if it does not exist yet. The password is stored as a bcrypt hash.
 */
import bcrypt from "bcryptjs";
import sequelize from "../ulits/database.js";

const [username, password] = process.argv.slice(2);

if (!username || !password) {
  console.error("Usage: npm run create-user -- <username> <password>");
  process.exit(1);
}
if (password.length < 6) {
  console.error("Please use a password of at least 6 characters.");
  process.exit(1);
}

try {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS userschema (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(100) NOT NULL
    )`);
  const hash = await bcrypt.hash(password, 10);
  await sequelize.query(
    `INSERT INTO userschema (username, password) VALUES ($1, $2)
     ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password`,
    { bind: [username.trim(), hash] }
  );
  console.log(`✅ User "${username.trim()}" is ready. You can sign in now.`);
} catch (error) {
  console.error(`❌ Could not create the user: ${error.message}`);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
