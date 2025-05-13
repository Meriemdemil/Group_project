import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Signup
router.post("/signup", async (req, res) => {
  
  const { email, password } = req.body;
  console.log("Signup request:", req.body);

  // Only allow emails ending with @ensia.edu.dz
  const allowedDomain = /@ensia\.edu\.dz$/;
  if (!allowedDomain.test(email)) {
    console.log("❌ Email domain not allowed");
    return res
      .status(400)
      .json({ error: 'Email must be the one of your school "ENSIA"' });
  }

  try {
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      console.log("❌ Email already exists");
      return res.status(409).json({ error: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const id = uuidv4();
    console.log("🛠 Inserting user into DB:", email);
    await pool.query(
      "INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)",
      [id, email, hashed]
    );
    res.status(201).json({ success: true, userId: id, email });
  } catch (err) {
    res.status(500).json({ error: "Signup failed", detail: err.message });
  }
});


// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login request:', req.body);

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user.id, email }, process.env.JWT_SECRET, {
      
    });

    res.json({ token, email, userId: user.id });
  } catch (err) {
    console.error('❌ Login failed', err);
    res.status(500).json({ error: 'Login failed' });
  }
});


export default router;
