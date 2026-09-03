const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { computeLoanBalance } = require("../utils/interest");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const { search } = req.query;
  const customers = await prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { idNumber: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    include: { loans: { include: { payments: true } } },
  });

  const withBalances = customers.map((c) => {
    const loans = c.loans.map((l) => ({ ...l, balanceInfo: computeLoanBalance(l) }));
    const outstanding = loans
      .filter((l) => l.status !== "written_off")
      .reduce((sum, l) => sum + l.balanceInfo.balance, 0);
    return { ...c, loans, outstanding: Math.round(outstanding * 100) / 100 };
  });

  res.json(withBalances);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { loans: { include: { payments: true }, orderBy: { startDate: "desc" } } },
  });
  if (!customer) return res.status(404).json({ error: "Customer not found" });

  const loans = customer.loans.map((l) => ({ ...l, balanceInfo: computeLoanBalance(l) }));
  res.json({ ...customer, loans });
});

router.post("/", async (req, res) => {
  const { name, phone, email, address, idNumber, notes } = req.body;
  if (!name) return res.status(400).json({ error: "Customer name is required" });

  const customer = await prisma.customer.create({
    data: { name, phone, email, address, idNumber, notes },
  });
  res.status(201).json(customer);
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, phone, email, address, idNumber, notes } = req.body;
  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: { name, phone, email, address, idNumber, notes },
    });
    res.json(customer);
  } catch (err) {
    res.status(404).json({ error: "Customer not found" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const loanCount = await prisma.loan.count({ where: { customerId: id } });
  if (loanCount > 0) {
    return res.status(400).json({ error: "Cannot delete a customer that has loan history. Consider editing instead." });
  }
  await prisma.customer.delete({ where: { id } });
  res.status(204).end();
});

module.exports = router;
