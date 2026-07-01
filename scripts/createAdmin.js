import mysql from "mysql2";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const db = mysql
  .createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })
  .promise();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash("123456", 10);

    const [rows] = await db.execute("SELECT id FROM users WHERE email = ?", [
      "admin@gmail.com",
    ]);

    if (rows.length > 0) {
      console.log("Admin already exists.");
      process.exit();
    }

    await db.execute(
      `INSERT INTO users(fullname, email, password, role)
       VALUES (?, ?, ?, ?)`,
      ["Alpha Admin", "admin@gmail.com", hashedPassword, "admin"],
    );

    console.log("✅ Admin account created.");
  } catch (err) {
    console.error(err.message);
  } finally {
    process.exit();
  }
}

createAdmin();
