const express = require("express");
const crypto = require("crypto");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { ownerScope } = require("../utils/scope");

const router = express.Router();
router.use(requireAuth);

function total(items) {
  return Math.round(items.reduce((sum, i) => sum + i.amount, 0) * 100) / 100;
}

// The invoice's branding/banking details always come from whoever created
// it (their own side-business profile), not the viewer - relevant when an
// admin looks at another lender's invoice.
async function companyFor(userId) {
  const issuer = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  return {
    name: issuer?.invoiceCompanyName || "Invoice",
    logo: issuer?.invoiceLogo || null,
    bankAccountHolder: issuer?.invoiceBankAccountHolder || null,
    bankAccountNumber: issuer?.invoiceBankAccountNumber || null,
    bankName: issuer?.invoiceBankName || null,
    branchCode: issuer?.invoiceBranchCode || null,
  };
}

router.get("/", async (req, res) => {
  const { customerId } = req.query;
  const invoices = await prisma.invoice.findMany({
    where: {
      customer: ownerScope(req),
      customerId: customerId ? Number(customerId) : undefined,
    },
    include: { customer: true, items: true },
    orderBy: { date: "desc" },
  });
  const companies = {};
  for (const inv of invoices) {
    if (!(inv.createdBy in companies)) companies[inv.createdBy] = await companyFor(inv.createdBy);
  }
  res.json(invoices.map((inv) => ({ ...inv, total: total(inv.items), company: companies[inv.createdBy] })));
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const invoice = await prisma.invoice.findFirst({
    where: { id, customer: ownerScope(req) },
    include: { customer: true, items: true },
  });
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });
  res.json({ ...invoice, total: total(invoice.items), company: await companyFor(invoice.createdBy) });
});

router.post("/", async (req, res) => {
  const { customerId, date, notes, items } = req.body;
  if (!customerId) return res.status(400).json({ error: "customerId is required" });
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "At least one line item is required" });
  }
  for (const item of items) {
    if (!item.description || !(Number(item.amount) > 0)) {
      return res.status(400).json({ error: "Each item needs a description and a positive amount" });
    }
  }

  const customer = await prisma.customer.findFirst({ where: { id: Number(customerId), ...ownerScope(req) } });
  if (!customer) return res.status(404).json({ error: "Customer not found" });

  const invoice = await prisma.invoice.create({
    data: {
      customerId: Number(customerId),
      date: date ? new Date(date) : new Date(),
      notes,
      createdBy: req.user.id,
      items: {
        create: items.map((i) => ({ description: i.description, amount: Number(i.amount) })),
      },
    },
    include: { customer: true, items: true },
  });
  res.status(201).json({ ...invoice, total: total(invoice.items) });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { date, notes, items } = req.body;
  const existing = await prisma.invoice.findFirst({ where: { id, customer: ownerScope(req) } });
  if (!existing) return res.status(404).json({ error: "Invoice not found" });

  if (items) {
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "At least one line item is required" });
    }
    for (const item of items) {
      if (!item.description || !(Number(item.amount) > 0)) {
        return res.status(400).json({ error: "Each item needs a description and a positive amount" });
      }
    }
  }

  const invoice = await prisma.$transaction(async (tx) => {
    if (items) {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
    }
    return tx.invoice.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        notes,
        items: items ? { create: items.map((i) => ({ description: i.description, amount: Number(i.amount) })) } : undefined,
      },
      include: { customer: true, items: true },
    });
  });
  res.json({ ...invoice, total: total(invoice.items) });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.invoice.findFirst({ where: { id, customer: ownerScope(req) } });
  if (!existing) return res.status(404).json({ error: "Invoice not found" });

  await prisma.invoice.delete({ where: { id } });
  res.status(204).end();
});

// Get (or create, on first use) the token that lets this invoice be viewed
// publicly without logging in, e.g. from a WhatsApp link.
router.post("/:id/share", async (req, res) => {
  const id = Number(req.params.id);
  const invoice = await prisma.invoice.findFirst({ where: { id, customer: ownerScope(req) } });
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });

  if (invoice.shareToken) {
    return res.json({ shareToken: invoice.shareToken });
  }
  const shareToken = crypto.randomBytes(20).toString("hex");
  await prisma.invoice.update({ where: { id }, data: { shareToken } });
  res.json({ shareToken });
});

module.exports = router;
