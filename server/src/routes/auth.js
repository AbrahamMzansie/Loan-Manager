const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// Bootstrap route: creates the very first admin account when the users
// table is empty. Disable via ALLOW_FIRST_ADMIN_SETUP=false once you've
// created your account (see .env.example).
router.post("/register-first-admin", async (req, res) => {
  if (process.env.ALLOW_FIRST_ADMIN_SETUP !== "true") {
    return res.status(403).json({ error: "First-admin setup is disabled" });
  }
  const count = await prisma.user.count();
  if (count > 0) {
    return res.status(403).json({ error: "Setup already completed. Ask an admin to create your account." });
  }

  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password required" });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hash, role: "admin" },
  });

  const token = signToken(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Admin-only: invite/create staff or admin accounts.
router.post("/users", requireAuth, requireAdmin, async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password required" });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "A user with that email already exists" });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hash, role: role === "admin" ? "admin" : "staff" },
  });
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(users);
});

router.get("/me", requireAuth, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
