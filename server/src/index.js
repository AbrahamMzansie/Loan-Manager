require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const customerRoutes = require("./routes/customers");
const loanRoutes = require("./routes/loans");
const dashboardRoutes = require("./routes/dashboard");
const settingsRoutes = require("./routes/settings");
const publicRoutes = require("./routes/public");
const invoiceRoutes = require("./routes/invoices");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map((s) => s.trim());
app.use(cors({ origin: allowedOrigins }));
// Raised from the 100kb default so a base64-encoded invoice logo fits in
// the request body (see Settings PUT /me).
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/invoices", invoiceRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Loan manager API listening on port ${port}`);
});
