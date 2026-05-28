import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "@workspace/db";
import { requireAdminAuth, signAdminToken } from "../middlewares/auth.js";

const router = Router();

router.post("/admin/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "username and password required" });
    return;
  }
  try {
    const result = await pool.query(
      "SELECT id, username, password_hash, role FROM admin_users WHERE username = $1",
      [username]
    );
    if (result.rows.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const admin = result.rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    await pool.query("UPDATE admin_users SET last_login = NOW() WHERE id = $1", [admin.id]);
    const token = signAdminToken({ adminId: admin.id, username: admin.username, role: admin.role });
    res.json({
      token,
      admin: { id: admin.id, username: admin.username, role: admin.role }
    });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/admin/auth/profile", requireAdminAuth, async (req, res) => {
  const result = await pool.query(
    "SELECT id, username, role, last_login FROM admin_users WHERE id = $1",
    [req.admin!.adminId]
  );
  if (result.rows.length === 0) { res.status(404).json({ error: "Admin not found" }); return; }
  const a = result.rows[0];
  res.json({ id: a.id, username: a.username, role: a.role, lastLogin: a.last_login });
});

export default router;
