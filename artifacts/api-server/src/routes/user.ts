import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "@workspace/db";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/user/dashboard", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const [balRes, betsRes, marketsRes, resultsRes, notifRes] = await Promise.all([
      pool.query("SELECT balance FROM users WHERE id = $1", [userId]),
      pool.query("SELECT COUNT(*) as total, SUM(CASE WHEN status='won' THEN win_amount ELSE 0 END) as won, SUM(CASE WHEN status='lost' THEN total_amount ELSE 0 END) as lost FROM bets WHERE user_id = $1", [userId]),
      pool.query("SELECT id, name, open_time, close_time, status, min_bet, max_bet, payout_ratio, is_betting_open FROM markets WHERE status = 'active' ORDER BY open_time LIMIT 10"),
      pool.query(`SELECT r.id, r.market_id, m.name as market_name, r.date, r.open_number, r.close_number, r.jodi_number, r.status, r.created_at
        FROM results r JOIN markets m ON r.market_id = m.id WHERE r.status = 'completed' ORDER BY r.created_at DESC LIMIT 5`),
      pool.query("SELECT id, title, message, type, is_read, created_at FROM user_notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10", [userId])
    ]);
    const recentBets = await pool.query(
      `SELECT b.id, b.market_id, m.name as market_name, b.game_type, b.numbers, b.total_amount, b.status, b.win_amount, b.created_at
       FROM bets b JOIN markets m ON b.market_id = m.id WHERE b.user_id = $1 ORDER BY b.created_at DESC LIMIT 5`,
      [userId]
    );
    const stats = betsRes.rows[0];
    const unread = notifRes.rows.filter((n: any) => !n.is_read).length;
    res.json({
      balance: parseFloat(balRes.rows[0]?.balance || "0"),
      totalBets: parseInt(stats.total),
      totalWon: parseFloat(stats.won || "0"),
      totalLost: parseFloat(stats.lost || "0"),
      recentBets: recentBets.rows.map(formatBet),
      activeMarkets: marketsRes.rows.map(formatMarket),
      recentResults: resultsRes.rows.map(formatResult),
      notifications: notifRes.rows.map(formatNotif),
      unreadNotifications: unread
    });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Failed to get dashboard" });
  }
});

router.get("/user/balance", requireAuth, async (req, res) => {
  const result = await pool.query("SELECT balance FROM users WHERE id = $1", [req.user!.userId]);
  res.json({ balance: parseFloat(result.rows[0]?.balance || "0") });
});

router.get("/user/bets", requireAuth, async (req, res) => {
  const { filter, status } = req.query;
  let dateFilter = "";
  if (filter === "today") dateFilter = "AND DATE(b.created_at) = CURRENT_DATE";
  else if (filter === "yesterday") dateFilter = "AND DATE(b.created_at) = CURRENT_DATE - 1";
  else if (filter === "week") dateFilter = "AND b.created_at >= NOW() - INTERVAL '7 days'";
  const statusFilter = status ? `AND b.status = '${String(status).replace(/[^a-z_]/g,'')}'` : "";
  const result = await pool.query(
    `SELECT b.id, b.market_id, m.name as market_name, b.game_type, b.numbers, b.total_amount, b.status, b.win_amount, b.created_at, b.settled_at
     FROM bets b JOIN markets m ON b.market_id = m.id WHERE b.user_id = $1 ${dateFilter} ${statusFilter} ORDER BY b.created_at DESC`,
    [req.user!.userId]
  );
  res.json({ bets: result.rows.map(formatBet) });
});

router.get("/user/winnings", requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT b.id, b.market_id, m.name as market_name, b.game_type, b.numbers, b.total_amount, b.status, b.win_amount, b.created_at
     FROM bets b JOIN markets m ON b.market_id = m.id WHERE b.user_id = $1 AND b.status = 'won' ORDER BY b.created_at DESC`,
    [req.user!.userId]
  );
  const totalWon = result.rows.reduce((sum: number, b: any) => sum + parseFloat(b.win_amount || 0), 0);
  res.json({ winnings: result.rows.map(formatBet), totalWon });
});

router.get("/user/transactions", requireAuth, async (req, res) => {
  const { type } = req.query;
  const typeFilter = type ? `AND type = '${String(type).replace(/[^a-z_]/g,'')}'` : "";
  const result = await pool.query(
    `SELECT id, user_id, type, amount, status, method, utr_number, screenshot_url, admin_note, bank_details, created_at, processed_at FROM transactions WHERE user_id = $1 ${typeFilter} ORDER BY created_at DESC`,
    [req.user!.userId]
  );
  res.json({ transactions: result.rows.map(formatTx) });
});

router.get("/user/referrals", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const userRes = await pool.query("SELECT referral_code FROM users WHERE id = $1", [userId]);
  const referrals = await pool.query(
    "SELECT full_name, created_at FROM users WHERE referred_by = $1 ORDER BY created_at DESC",
    [userId]
  );
  const commRes = await pool.query(
    "SELECT SUM(amount) as total FROM transactions WHERE user_id = $1 AND type = 'referral'",
    [userId]
  );
  res.json({
    referralCode: userRes.rows[0]?.referral_code || "",
    totalReferrals: referrals.rows.length,
    totalEarnings: parseFloat(commRes.rows[0]?.total || "0"),
    referrals: referrals.rows.map((r: any) => ({ name: r.full_name, date: r.created_at, earning: 0 }))
  });
});

router.get("/user/analytics", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const stats = await pool.query(
    `SELECT COUNT(*) as total_bets, COALESCE(SUM(total_amount),0) as total_wagered,
     COALESCE(SUM(CASE WHEN status='won' THEN win_amount ELSE 0 END),0) as total_won,
     COALESCE(SUM(CASE WHEN status='lost' THEN total_amount ELSE 0 END),0) as total_lost
     FROM bets WHERE user_id = $1`,
    [userId]
  );
  const monthly = await pool.query(
    `SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, SUM(total_amount) as wagered, SUM(CASE WHEN status='won' THEN win_amount ELSE 0 END) as won
     FROM bets WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days' GROUP BY date ORDER BY date`,
    [userId]
  );
  const s = stats.rows[0];
  const totalWon = parseFloat(s.total_won);
  const totalBets = parseInt(s.total_bets);
  res.json({
    totalBets, totalWagered: parseFloat(s.total_wagered),
    totalWon, winRate: totalBets > 0 ? (totalWon / parseFloat(s.total_wagered) * 100) : 0,
    profitLoss: totalWon - parseFloat(s.total_lost),
    favoriteMarket: "DISAWAR",
    monthlyData: monthly.rows.map((r: any) => ({ date: r.date, wagered: parseFloat(r.wagered), won: parseFloat(r.won) }))
  });
});

router.post("/user/change-password", requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await pool.query("SELECT password_hash FROM users WHERE id = $1", [req.user!.userId]);
  const valid = await bcrypt.compare(oldPassword, user.rows[0].password_hash);
  if (!valid) { res.status(400).json({ error: "Old password incorrect" }); return; }
  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, req.user!.userId]);
  res.json({ message: "Password changed", success: true });
});

router.get("/user/notifications", requireAuth, async (req, res) => {
  const result = await pool.query(
    "SELECT id, title, message, type, is_read, created_at FROM user_notifications WHERE user_id = $1 ORDER BY created_at DESC",
    [req.user!.userId]
  );
  const unreadCount = result.rows.filter((n: any) => !n.is_read).length;
  await pool.query("UPDATE user_notifications SET is_read = true WHERE user_id = $1", [req.user!.userId]);
  res.json({ notifications: result.rows.map(formatNotif), unreadCount });
});

function formatBet(b: any) {
  return {
    id: b.id, userId: b.user_id, marketId: b.market_id, marketName: b.market_name,
    gameType: b.game_type, numbers: b.numbers, totalAmount: parseFloat(b.total_amount),
    status: b.status, winAmount: parseFloat(b.win_amount || 0), createdAt: b.created_at, settledAt: b.settled_at
  };
}
function formatMarket(m: any) {
  return {
    id: m.id, name: m.name, openTime: m.open_time, closeTime: m.close_time,
    status: m.status, minBet: parseFloat(m.min_bet), maxBet: parseFloat(m.max_bet),
    payoutRatio: parseFloat(m.payout_ratio), isBettingOpen: m.is_betting_open
  };
}
function formatResult(r: any) {
  return {
    id: r.id, marketId: r.market_id, marketName: r.market_name, date: r.date,
    openNumber: r.open_number, closeNumber: r.close_number, jodiNumber: r.jodi_number,
    status: r.status, createdAt: r.created_at
  };
}
function formatTx(t: any) {
  return {
    id: t.id, userId: t.user_id, type: t.type, amount: parseFloat(t.amount),
    status: t.status, method: t.method, utrNumber: t.utr_number,
    screenshotUrl: t.screenshot_url, adminNote: t.admin_note,
    bankDetails: t.bank_details, createdAt: t.created_at, processedAt: t.processed_at
  };
}
function formatNotif(n: any) {
  return { id: n.id, title: n.title, message: n.message, type: n.type, isRead: n.is_read, createdAt: n.created_at };
}

export default router;
