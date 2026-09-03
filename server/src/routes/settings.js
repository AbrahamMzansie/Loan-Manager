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
  const me = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({
    ...settings,
    myDefaultRate: me.defaultRate,
    myDefaultPeriodDays: me.defaultPeriodDays,
  });
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

// Each user's own default loan terms, used for new loans they create
// instead of the org-wide defaults above. Pass null to clear and fall
// back to the org-wide defaults.
router.put("/me", async (req, res) => {
  const { defaultRate, defaultPeriodDays } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { defaultRate, defaultPeriodDays },
  });
  res.json({ defaultRate: user.defaultRate, defaultPeriodDays: user.defaultPeriodDays });
});

module.exports = router;
