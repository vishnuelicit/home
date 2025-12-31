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

/**
 * POST /boards/add-switch
*/

router.post('/add-switch', async (req, res) => {
  const { boardId, switches } = req.body;

  if (!boardId || !Array.isArray(switches)) {
    return res.status(400).json({
      success: false,
      message: 'boardId and switches array are required'
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // boardId can be numeric ID or board_id string
    const boardQuery = isNaN(boardId)
      ? 'SELECT id FROM boards WHERE board_id = $1'
      : 'SELECT id FROM boards WHERE id = $1';

    const boardResult = await client.query(boardQuery, [boardId]);

    if (boardResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    const actualBoardId = boardResult.rows[0].id;
    const inserted = [];

    for (const sw of switches) {
      if (!sw.switch_name || !sw.switch_type) continue;

      const result = await client.query(
        `
        INSERT INTO switches (board_id, switch_name, switch_type)
        VALUES ($1, $2, $3)
        RETURNING id, switch_name, switch_type, status
        `,
        [actualBoardId, sw.switch_name, sw.switch_type]
      );

      inserted.push(result.rows[0]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Switches added successfully',
      data: {
        board_id: actualBoardId,
        switches: inserted
      }
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Failed to add switches'
    });
  } finally {
    client.release();
  }
});

export default router;
