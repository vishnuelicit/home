import express from 'express';
import { pool } from '../db/pool.js';
import { authMiddleware } from '../auth/middleware.js';
import { send } from '../utils/response.js';

const router = express.Router();

router.use(authMiddleware);

/** ADD BOARD */
router.post('/add', async (req, res) => {
  const { boardId, name, type } = req.body;

  const result = await pool.query(
    `INSERT INTO boards (user_id, board_id, name, type)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [req.user.user_id, boardId, name, type]
  );

  send(res, true, 'Board added', result.rows[0], 201);
});

/** GET BOARDS */
router.get('/list', async (req, res) => {
  const result = await pool.query(
    `SELECT b.*, 
      json_agg(s.*) AS switches
     FROM boards b
     LEFT JOIN switches s ON s.board_id=b.id
     WHERE b.user_id=$1
     GROUP BY b.id
     ORDER BY b.created_at DESC`,
    [req.user.user_id]
  );

  send(res, true, 'Boards fetched', result.rows);
});

export default router;
