import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

function formatMarket(m: any) {
  return {
    id: m.id, name: m.name, openTime: m.open_time, closeTime: m.close_time,
    status: m.status, minBet: parseFloat(m.min_bet), maxBet: parseFloat(m.max_bet),
    payoutRatio: parseFloat(m.payout_ratio), isBettingOpen: m.is_betting_open,
    latestResult: m.latest_result || null
  };
}

router.get("/markets", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, r.open_number, r.close_number, r.jodi_number
       FROM markets m
       LEFT JOIN LATERAL (
         SELECT open_number, close_number, jodi_number FROM results
         WHERE market_id = m.id AND status = 'completed'
         ORDER BY date DESC LIMIT 1
       ) r ON true
       WHERE m.status != 'inactive' ORDER BY m.open_time`
    );
    res.json({
      markets: result.rows.map(m => ({
        ...formatMarket(m),
        latestResult: m.open_number ? { openNumber: m.open_number, closeNumber: m.close_number, jodiNumber: m.jodi_number } : null
      }))
    });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Failed to get markets" });
  }
});

router.get("/markets/:id", async (req, res) => {
  const result = await pool.query("SELECT * FROM markets WHERE id = $1", [req.params.id]);
  if (result.rows.length === 0) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatMarket(result.rows[0]));
});

router.get("/markets/:id/results", async (req, res) => {
  const result = await pool.query(
    `SELECT r.*, m.name as market_name FROM results r JOIN markets m ON r.market_id = m.id
     WHERE r.market_id = $1 ORDER BY r.date DESC LIMIT 30`,
    [req.params.id]
  );
  res.json({ results: result.rows.map((r: any) => ({
    id: r.id, marketId: r.market_id, marketName: r.market_name, date: r.date,
    openNumber: r.open_number, closeNumber: r.close_number, jodiNumber: r.jodi_number,
    status: r.status, createdAt: r.created_at
  })) });
});

router.get("/markets/:id/live-status", async (req, res) => {
  const result = await pool.query("SELECT id, status, is_betting_open, close_time FROM markets WHERE id = $1", [req.params.id]);
  if (result.rows.length === 0) { res.status(404).json({ error: "Not found" }); return; }
  const m = result.rows[0];
  res.json({ marketId: m.id, isOpen: m.is_betting_open, timeLeft: 0, status: m.status });
});

export default router;
