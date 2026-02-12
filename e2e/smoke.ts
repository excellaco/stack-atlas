/**
 * E2E post-deployment smoke test script.
 *
 * Run with: npx tsx e2e/smoke.ts
 *
 * Authenticates against real Cognito and hits real endpoints.
 * Logs each check as PASS/FAIL and exits with code 0 on success, 1 on failure.
 */

import { CognitoUserPool, CognitoUser, AuthenticationDetails } from "amazon-cognito-identity-js";

// ---------------------------------------------------------------------------
// Environment variables
// ---------------------------------------------------------------------------

const API_URL = process.env.E2E_API_URL || "https://api.stack-atlas.com";
const SITE_URL = process.env.E2E_SITE_URL || "https://stack-atlas.com";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const USER_POOL_ID = process.env.E2E_COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.E2E_COGNITO_CLIENT_ID;

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

async function authenticate(): Promise<string> {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !USER_POOL_ID || !CLIENT_ID) {
    throw new Error(
      "Missing E2E credentials (E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD, E2E_COGNITO_USER_POOL_ID, E2E_COGNITO_CLIENT_ID)"
    );
  }

  const pool = new CognitoUserPool({
    UserPoolId: USER_POOL_ID,
    ClientId: CLIENT_ID,
  });

  const user = new CognitoUser({ Username: ADMIN_EMAIL, Pool: pool });

  const authDetails = new AuthenticationDetails({
    Username: ADMIN_EMAIL,
    Password: ADMIN_PASSWORD,
  });

  return new Promise((resolve, reject) => {
    user.authenticateUser(authDetails, {
      onSuccess: (session) => resolve(session.getIdToken().getJwtToken()),
      onFailure: reject,
      newPasswordRequired: () => reject(new Error("Password change required for seed user")),
    });
  });
}

// ---------------------------------------------------------------------------
// Check definitions
// ---------------------------------------------------------------------------

interface Check {
  name: string;
  fn: (token: string | null) => Promise<void>;
  requiresAuth: boolean;
}

const checks: Check[] = [
  // 1. Frontend health (no auth required)
  {
    name: "Frontend health",
    requiresAuth: false,
    fn: async () => {
      const res = await fetch(SITE_URL);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const body = await res.text();
      if (!body.includes('<div id="root">')) throw new Error("Missing root div");
    },
  },

  // 2. API responds (no auth required)
  {
    name: "API responds",
    requiresAuth: false,
    fn: async () => {
      const res = await fetch(`${API_URL}/health-check-nonexistent`);
      // Lambda should respond (not 502/503 from API Gateway)
      if (res.status === 502 || res.status === 503)
        throw new Error(`API Gateway error: ${res.status}`);
    },
  },

  // 3. CORS headers present (no auth required)
  {
    name: "CORS headers present",
    requiresAuth: false,
    fn: async () => {
      const res = await fetch(`${API_URL}/projects`, {
        method: "OPTIONS",
        headers: { Origin: SITE_URL, "Access-Control-Request-Method": "GET" },
      });
      const acao = res.headers.get("access-control-allow-origin");
      if (!acao) throw new Error("Missing Access-Control-Allow-Origin header");
    },
  },

  // 4. List projects (requires auth)
  {
    name: "List projects (authenticated)",
    requiresAuth: true,
    fn: async (token) => {
      const res = await fetch(`${API_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = (await res.json()) as { data: unknown[] };
      if (!Array.isArray(json.data)) throw new Error("Response data is not an array");
    },
  },

  // 5. Get catalog (requires auth)
  {
    name: "Get catalog (authenticated)",
    requiresAuth: true,
    fn: async (token) => {
      const res = await fetch(`${API_URL}/catalog`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
    },
  },
];

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

async function runAuthStep(): Promise<{ token: string | null; passed: number; failed: number }> {
  if (ADMIN_EMAIL && ADMIN_PASSWORD && USER_POOL_ID && CLIENT_ID) {
    try {
      const token = await authenticate();
      console.log("PASS  Auth flow - obtained JWT token");
      return { token, passed: 1, failed: 0 };
    } catch (err) {
      console.log(`FAIL  Auth flow - ${(err as Error).message}`);
      return { token: null, passed: 0, failed: 1 };
    }
  }
  console.log("SKIP  Auth flow - credentials not provided");
  return { token: null, passed: 0, failed: 0 };
}

async function runChecks(token: string | null): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;
  for (const check of checks) {
    if (check.requiresAuth && !token) {
      console.log(`SKIP  ${check.name} - no auth token`);
      continue;
    }
    try {
      await check.fn(token);
      console.log(`PASS  ${check.name}`);
      passed++;
    } catch (err) {
      console.log(`FAIL  ${check.name} - ${(err as Error).message}`);
      failed++;
    }
  }
  return { passed, failed };
}

async function run(): Promise<void> {
  const auth = await runAuthStep();
  const results = await runChecks(auth.token);
  const passed = auth.passed + results.passed;
  const failed = auth.failed + results.failed;
  console.log(`\n${passed} passed, ${failed} failed, ${checks.length + 1} total`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
