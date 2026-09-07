// Fuzzy duplicate detection for new customers. Exact (normalized) matches on
// phone/ID/email are strong signals; name/address use edit-distance
// similarity to catch typos ("Thembie" vs "Thembi") without silently
// blocking two different people who happen to share a common name.

function normalize(s) {
  return (s || "").toString().trim().toLowerCase();
}

function normalizePhone(s) {
  const digits = (s || "").toString().replace(/\D/g, "");
  return digits.replace(/^27/, "0");
}

function normalizeId(s) {
  return (s || "").toString().replace(/[\s-]/g, "").toLowerCase();
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

// 1.0 = identical, 0.0 = nothing in common.
function similarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  const dist = levenshtein(na, nb);
  return 1 - dist / Math.max(na.length, nb.length);
}

const NAME_THRESHOLD = 0.82;
const ADDRESS_THRESHOLD = 0.85;

function findDuplicates(input, existingCustomers) {
  const results = [];

  for (const c of existingCustomers) {
    const reasons = [];

    if (input.phone && c.phone && normalizePhone(input.phone) === normalizePhone(c.phone)) {
      reasons.push("Same phone number");
    }
    if (input.idNumber && c.idNumber && normalizeId(input.idNumber) === normalizeId(c.idNumber)) {
      reasons.push("Same ID number");
    }
    if (input.email && c.email && normalize(input.email) === normalize(c.email)) {
      reasons.push("Same email");
    }

    const nameSim = similarity(input.name, c.name);
    if (nameSim >= NAME_THRESHOLD) {
      reasons.push(nameSim >= 0.999 ? "Same name" : "Very similar name");
    }

    if (input.address && c.address) {
      const addrSim = similarity(input.address, c.address);
      if (addrSim >= ADDRESS_THRESHOLD) reasons.push("Very similar address");
    }

    if (reasons.length > 0) {
      results.push({
        customer: { id: c.id, name: c.name, phone: c.phone, idNumber: c.idNumber, email: c.email },
        reasons,
      });
    }
  }

  return results;
}

module.exports = { findDuplicates, similarity, levenshtein };
