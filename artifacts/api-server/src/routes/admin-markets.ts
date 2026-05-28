import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAdminAuth } from "../middlewares/auth.js";

const router = Router();

function formatMarket(m: any) {
  return {
    id: m.id, name: m.name, openTime: m.open_time, closeTime: m.close_time,
    status: m.status, minBet: parseFloat(m.min_bet), maxBet: parseFloat(m.max_bet),
    payoutRatio: parseFloat(m.payout_ratio), isBettingOpen: m.is_betting_open
  };
}

router.get("/admin/markets", requireAdminAuth, async (req, res) => {
  const result = await pool.query("SELECT * FROM markets ORDER BY open_time");
  res.json({ markets: result.rows.map(formatMarket) });
});

router.post("/admin/markets", requireAdminAuth, async (req, res) => {
  const { name, openTime, closeTime, minBet, maxBet, payoutRatio, status } = req.body;
  if (!name || !openTime || !closeTime) { res.status(400).json({ error: "name, openTime, closeTime required" }); return; }
  const result = await pool.query(
    `INSERT INTO markets (name, open_time, close_time, min_bet, max_bet, payout_ratio, status, is_betting_open)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING *`,
    [name, openTime, closeTime, minBet || 10, maxBet || 10000, payoutRatio || 90, status || "active"]
  );
  res.status(201).json(formatMarket(result.rows[0]));
});

router.put("/admin/markets/:id", requireAdminAuth, async (req, res) => {
  const { name, openTime, closeTime, minBet, maxBet, payoutRatio, status } = req.body;
  const result = await pool.query(
    `UPDATE markets SET name = COALESCE($1, name), open_time = COALESCE($2, open_time),
     close_time = COALESCE($3, close_time), min_bet = COALESCE($4, min_bet),
     max_bet = COALESCE($5, max_bet), payout_ratio = COALESCE($6, payout_ratio),
     status = COALESCE($7, status) WHERE id = $8 RETURNING *`,
    [name, openTime, closeTime, minBet, maxBet, payoutRatio, status, req.params.id]
  );
  if (result.rows.length === 0) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatMarket(result.rows[0]));
});

router.delete("/admin/markets/:id", requireAdminAuth, async (req, res) => {
  await pool.query("UPDATE markets SET status = 'inactive' WHERE id = $1", [req.params.id]);
  res.json({ message: "Market deactivated", success: true });
});

router.put("/admin/markets/:id/status", requireAdminAuth, async (req, res) => {
  const { status } = req.body;
  const allowed = ["active", "inactive", "maintenance"];
  if (!allowed.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }
  await pool.query("UPDATE markets SET status = $1 WHERE id = $2", [status, req.params.id]);
  res.json({ message: `Market ${status}`, success: true });
});

export default router;
