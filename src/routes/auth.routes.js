import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/pool.js';
import { signToken } from '../auth/jwt.js';
import { authMiddleware } from '../auth/middleware.js';
import { send } from '../utils/response.js';

const router = express.Router();

/** REGISTER */
router.post('/register', async (req, res) => {
  const { username, email, password, fullName, phone } = req.body;

  if (!username || !email || !password || !fullName)
    return send(res, false, 'Missing fields', null, 400);

  const hash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      `INSERT INTO users (username, email, password, full_name, phone)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id,email`,
      [username, email, hash, fullName, phone]
    );

    const token = signToken({
      user_id: result.rows[0].id,
      email
    });

    send(res, true, 'User registered', { token }, 201);
  } catch (e) {
    send(res, false, e.message, null, 409);
  }
});

/** LOGIN */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await pool.query(
    `SELECT * FROM users WHERE email=$1`,
    [email]
  );

  if (
    user.rowCount === 0 ||
    !(await bcrypt.compare(password, user.rows[0].password))
  ) {
    return send(res, false, 'Invalid credentials', null, 401);
  }

  const token = signToken({
    user_id: user.rows[0].id,
    email
  });

  send(res, true, 'Login successful', { token });
});

/** IS REGISTERED */
router.get('/is-registered', authMiddleware, async (req, res) => {
  const user = await pool.query(
    `SELECT id,username,email,full_name FROM users WHERE id=$1`,
    [req.user.user_id]
  );

  send(res, true, 'User found', user.rows[0]);
});

export default router;
