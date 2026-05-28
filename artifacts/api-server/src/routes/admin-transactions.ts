import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAdminAuth } from "../middlewares/auth.js";

const router = Router();

function formatTx(t: any) {
  return {
    id: t.id, userId: t.user_id, userName: t.user_name, type: t.type,
    amount: parseFloat(t.amount), status: t.status, method: t.method,
    utrNumber: t.utr_number, screenshotUrl: t.screenshot_url, adminNote: t.admin_note,
    bankDetails: t.bank_details, createdAt: t.created_at, processedAt: t.processed_at
  };
}

router.get("/admin/transactions/deposits", requireAdminAuth, async (req, res) => {
  const { status, page = 1 } = req.query;
  const limit = 20;
  const offset = (Number(page) - 1) * limit;
  const conditions = ["t.type = 'deposit'"];
  const params: any[] = [];
  let idx = 1;
  if (status) { conditions.push(`t.status = $${idx++}`); params.push(status); }
  const where = "WHERE " + conditions.join(" AND ");
  const countRes = await pool.query(`SELECT COUNT(*) FROM transactions t ${where}`, params);
  params.push(limit, offset);
  const result = await pool.query(
    `SELECT t.*, u.full_name as user_name FROM transactions t JOIN users u ON t.user_id = u.id ${where} ORDER BY t.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
    params
  );
  const total = parseInt(countRes.rows[0].count);
  res.json({ transactions: result.rows.map(formatTx), total, page: Number(page), totalPages: Math.ceil(total / limit) });
});

router.get("/admin/transactions/withdrawals", requireAdminAuth, async (req, res) => {
  const { status, page = 1 } = req.query;
  const limit = 20;
  const offset = (Number(page) - 1) * limit;
  const conditions = ["t.type = 'withdrawal'"];
  const params: any[] = [];
  let idx = 1;
  if (status) { conditions.push(`t.status = $${idx++}`); params.push(status); }
  const where = "WHERE " + conditions.join(" AND ");
  const countRes = await pool.query(`SELECT COUNT(*) FROM transactions t ${where}`, params);
  params.push(limit, offset);
  const result = await pool.query(
    `SELECT t.*, u.full_name as user_name FROM transactions t JOIN users u ON t.user_id = u.id ${where} ORDER BY t.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
    params
  );
  const total = parseInt(countRes.rows[0].count);
  res.json({ transactions: result.rows.map(formatTx), total, page: Number(page), totalPages: Math.ceil(total / limit) });
});

router.put("/admin/transactions/deposits/:id/approve", requireAdminAuth, async (req, res) => {
  const tx = await pool.query("SELECT * FROM transactions WHERE id = $1 AND type = 'deposit'", [req.params.id]);
  if (tx.rows.length === 0) { res.status(404).json({ error: "Not found" }); return; }
  if (tx.rows[0].status !== "pending") { res.status(400).json({ error: "Already processed" }); return; }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE transactions SET status = 'completed', processed_at = NOW(), processed_by = $1 WHERE id = $2",
      [req.admin!.adminId, req.params.id]);
    await client.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [tx.rows[0].amount, tx.rows[0].user_id]);
    await client.query("COMMIT");
    res.json({ message: "Deposit approved", success: true });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Failed" });
  } finally {
    client.release();
  }
});

router.put("/admin/transactions/deposits/:id/reject", requireAdminAuth, async (req, res) => {
  const { reason } = req.body;
  await pool.query(
    "UPDATE transactions SET status = 'rejected', admin_note = $1, processed_at = NOW(), processed_by = $2 WHERE id = $3",
    [reason, req.admin!.adminId, req.params.id]
  );
  res.json({ message: "Deposit rejected", success: true });
});

router.put("/admin/transactions/withdrawals/:id/complete", requireAdminAuth, async (req, res) => {
  await pool.query(
    "UPDATE transactions SET status = 'completed', processed_at = NOW(), processed_by = $1 WHERE id = $2",
    [req.admin!.adminId, req.params.id]
  );
  res.json({ message: "Withdrawal completed", success: true });
});

router.put("/admin/transactions/withdrawals/:id/reject", requireAdminAuth, async (req, res) => {
  const { reason } = req.body;
  const tx = await pool.query("SELECT * FROM transactions WHERE id = $1 AND type = 'withdrawal'", [req.params.id]);
  if (tx.rows.length === 0) { res.status(404).json({ error: "Not found" }); return; }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE transactions SET status = 'rejected', admin_note = $1, processed_at = NOW(), processed_by = $2 WHERE id = $3",
      [reason, req.admin!.adminId, req.params.id]);
    await client.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [tx.rows[0].amount, tx.rows[0].user_id]);
    await client.query("COMMIT");
    res.json({ message: "Withdrawal rejected, amount refunded", success: true });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Failed" });
  } finally {
    client.release();
  }
});

export default router;
