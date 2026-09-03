const express = require("express");
const prisma = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  let settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: 1 } });
  }
  res.json(settings);
});

router.put("/", requireAdmin, async (req, res) => {
  const { businessName, defaultRate, defaultPeriodDays } = req.body;
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: { businessName, defaultRate, defaultPeriodDays },
    create: { id: 1, businessName, defaultRate, defaultPeriodDays },
  });
  res.json(settings);
});

module.exports = router;
