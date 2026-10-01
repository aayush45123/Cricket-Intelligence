import test from "node:test";
import assert from "node:assert/strict";

test("Season Parameter Validation: only valid 4-digit IPL years accepted", () => {
  const isValidSeason = (s) => /^(20\d{2})$/.test(String(s));

  assert.equal(isValidSeason("2024"), true);
  assert.equal(isValidSeason("2008"), true);
  assert.equal(isValidSeason("2015"), true);

  // Invalid cases
  assert.equal(isValidSeason("1999"), false);
  assert.equal(isValidSeason("abc"), false);
  assert.equal(isValidSeason("2024; DROP TABLE"), false);
  assert.equal(isValidSeason(""), false);
  assert.equal(isValidSeason(null), false);
});

test("Pagination Parameters: enforces boundaries", () => {
  const sanitizePagination = (pageQuery, limitQuery) => {
    const rawPage = parseInt(pageQuery, 10);
    const page = isNaN(rawPage) ? 1 : Math.max(1, rawPage);
    const rawLimit = parseInt(limitQuery, 10);
    const limit = isNaN(rawLimit) ? 20 : Math.min(100, Math.max(1, rawLimit));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
  };

  assert.deepEqual(sanitizePagination("1", "20"), { page: 1, limit: 20, skip: 0 });
  assert.deepEqual(sanitizePagination("3", "10"), { page: 3, limit: 10, skip: 20 });

  // Negative or NaN boundaries
  assert.deepEqual(sanitizePagination("-5", "0"), { page: 1, limit: 1, skip: 0 });
  assert.deepEqual(sanitizePagination("abc", "999"), { page: 1, limit: 100, skip: 0 });
});

test("CORS origin validator allows localhost, configured domains, and blocks unknown", () => {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://cricket-intelligence.vercel.app",
  ];

  const checkOrigin = (origin) => {
    if (!origin) return true; // Server-to-server or Postman
    return allowedOrigins.includes(origin);
  };

  assert.equal(checkOrigin("http://localhost:5173"), true);
  assert.equal(checkOrigin("https://cricket-intelligence.vercel.app"), true);
  assert.equal(checkOrigin(undefined), true);
  assert.equal(checkOrigin("https://malicious-site.com"), false);
});
