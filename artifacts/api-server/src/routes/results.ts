import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

function formatResult(r: any) {
  return {
    id: r.id, marketId: r.market_id, marketName: r.market_name, date: r.date,
    openNumber: r.open_number, closeNumber: r.close_number, jodiNumber: r.jodi_number,
    status: r.status, createdAt: r.created_at
  };
}

router.get("/results/recent", async (req, res) => {
  const result = await pool.query(
    `SELECT r.*, m.name as market_name FROM results r JOIN markets m ON r.market_id = m.id
     WHERE r.status = 'completed' ORDER BY r.date DESC, r.created_at DESC LIMIT 20`
  );
  res.json({ results: result.rows.map(formatResult) });
});

router.get("/results/market/:id", async (req, res) => {
  const result = await pool.query(
    `SELECT r.*, m.name as market_name FROM results r JOIN markets m ON r.market_id = m.id
     WHERE r.market_id = $1 ORDER BY r.date DESC LIMIT 30`,
    [req.params.id]
  );
  res.json({ results: result.rows.map(formatResult) });
});

router.get("/results/charts/:marketId", async (req, res) => {
  const result = await pool.query(
    `SELECT date, open_number, close_number, jodi_number FROM results
     WHERE market_id = $1 AND status = 'completed' ORDER BY date DESC LIMIT 30`,
    [req.params.marketId]
  );
  res.json({
    marketId: req.params.marketId,
    data: result.rows.map((r: any) => ({
      date: r.date, openNumber: r.open_number, closeNumber: r.close_number, jodiNumber: r.jodi_number
    }))
  });
});

export default router;
