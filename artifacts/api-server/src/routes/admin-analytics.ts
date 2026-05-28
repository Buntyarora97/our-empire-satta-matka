import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAdminAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/admin/analytics/dashboard", requireAdminAuth, async (req, res) => {
  try {
    const [usersRes, betsRes, depositsRes, withdrawalsRes, marketsRes, activityRes, growthRes, revenueRes] = await Promise.all([
      pool.query("SELECT COUNT(*) as total, COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today FROM users"),
      pool.query("SELECT COUNT(*) as total, COALESCE(SUM(total_amount),0) as wagered FROM bets WHERE DATE(created_at) = CURRENT_DATE"),
      pool.query("SELECT COUNT(CASE WHEN status='pending' THEN 1 END) as pending, COALESCE(SUM(CASE WHEN DATE(created_at)=CURRENT_DATE AND status='completed' THEN amount ELSE 0 END),0) as today FROM transactions WHERE type='deposit'"),
      pool.query("SELECT COUNT(CASE WHEN status='pending' THEN 1 END) as pending, COALESCE(SUM(CASE WHEN DATE(created_at)=CURRENT_DATE AND status='completed' THEN amount ELSE 0 END),0) as today FROM transactions WHERE type='withdrawal'"),
      pool.query("SELECT COUNT(*) as total FROM markets WHERE status = 'active'"),
      pool.query("SELECT a.action, a.details, a.created_at, COALESCE(u.full_name, au.username) as actor FROM activity_logs a LEFT JOIN users u ON a.user_id = u.id LEFT JOIN admin_users au ON a.admin_id = au.id ORDER BY a.created_at DESC LIMIT 10"),
      pool.query("SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY date ORDER BY date"),
      pool.query("SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COALESCE(SUM(CASE WHEN type='deposit' AND status='completed' THEN amount ELSE 0 END),0) as revenue FROM transactions WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY date ORDER BY date")
    ]);
    res.json({
      totalUsers: parseInt(usersRes.rows[0].total),
      newUsersToday: parseInt(usersRes.rows[0].today),
      totalBetsToday: parseInt(betsRes.rows[0].total),
      totalWageredToday: parseFloat(betsRes.rows[0].wagered),
      pendingDeposits: parseInt(depositsRes.rows[0].pending),
      totalDepositsToday: parseFloat(depositsRes.rows[0].today),
      pendingWithdrawals: parseInt(withdrawalsRes.rows[0].pending),
      totalWithdrawalsToday: parseFloat(withdrawalsRes.rows[0].today),
      activeMarkets: parseInt(marketsRes.rows[0].total),
      recentActivity: activityRes.rows.map((a: any) => ({ id: a.id || Math.random().toString(), action: a.action, details: a.details, createdAt: a.created_at })),
      userGrowth: growthRes.rows.map((r: any) => ({ date: r.date, count: parseInt(r.count) })),
      revenueData: revenueRes.rows.map((r: any) => ({ date: r.date, revenue: parseFloat(r.revenue) }))
    });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

router.get("/admin/analytics/revenue", requireAdminAuth, async (req, res) => {
  const { period = "daily" } = req.query;
  const formatMap: Record<string, string> = { daily: "YYYY-MM-DD", weekly: "IYYY-IW", monthly: "YYYY-MM", yearly: "YYYY" };
  const fmt = formatMap[String(period)] || "YYYY-MM-DD";
  const result = await pool.query(
    `SELECT TO_CHAR(created_at, '${fmt}') as date,
     COALESCE(SUM(CASE WHEN type='deposit' AND status='completed' THEN amount ELSE 0 END),0) as deposits,
     COALESCE(SUM(CASE WHEN type='withdrawal' AND status='completed' THEN amount ELSE 0 END),0) as withdrawals,
     COALESCE(SUM(CASE WHEN type='bet' AND status='completed' THEN amount ELSE 0 END),0) as bets
     FROM transactions WHERE created_at >= NOW() - INTERVAL '90 days' GROUP BY date ORDER BY date`
  );
  const totals = result.rows.reduce((acc: any, r: any) => ({
    totalDeposits: acc.totalDeposits + parseFloat(r.deposits),
    totalWithdrawals: acc.totalWithdrawals + parseFloat(r.withdrawals),
    netRevenue: acc.netRevenue + parseFloat(r.deposits) - parseFloat(r.withdrawals)
  }), { totalDeposits: 0, totalWithdrawals: 0, netRevenue: 0 });
  res.json({
    period,
    data: result.rows.map((r: any) => ({
      date: r.date, deposits: parseFloat(r.deposits), withdrawals: parseFloat(r.withdrawals),
      bets: parseFloat(r.bets), profit: parseFloat(r.deposits) - parseFloat(r.withdrawals)
    })),
    totals
  });
});

router.get("/admin/analytics/users", requireAdminAuth, async (req, res) => {
  const [totalRes, activeRes, growthRes] = await Promise.all([
    pool.query("SELECT COUNT(*) as total FROM users"),
    pool.query("SELECT COUNT(*) as active FROM users WHERE status = 'active' AND last_login >= NOW() - INTERVAL '7 days'"),
    pool.query(`SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as new_users
     FROM users WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY date ORDER BY date`)
  ]);
  res.json({
    totalUsers: parseInt(totalRes.rows[0].total),
    activeUsers: parseInt(activeRes.rows[0].active),
    data: growthRes.rows.map((r: any) => ({ date: r.date, newUsers: parseInt(r.new_users), activeUsers: 0 }))
  });
});

export default router;
