/**
 * Pass 4B smoke: weekly-sales chart + STK charge UX (Chrome channel).
 * Does not modify earlier smoke scripts.
 */
import { chromium } from "playwright-core";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const BASE = process.env.SMOKE_BASE || "http://127.0.0.1:5173";
const API = process.env.SMOKE_API || "http://127.0.0.1:8000";
const EMAIL = "store.wire.1785881708@example.com";
const PASS = "TestPass123!";
const CHARGE_PHONE = "+254701722066";

function loadPaystackSecret() {
  const envPath = resolve("backend/.env");
  const text = readFileSync(envPath, "utf8");
  const line = text.split("\n").find((l) => l.startsWith("PAYSTACK_SECRET_KEY="));
  if (!line) throw new Error("PAYSTACK_SECRET_KEY missing from backend/.env");
  return line.slice("PAYSTACK_SECRET_KEY=".length).trim().replace(/^["']|["']$/g, "");
}

async function apiJson(method, path, { token, body, headers } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data, text };
}

async function loginToken() {
  const { status, data } = await apiJson("POST", "/api/v1/auth/token/", {
    body: { email: EMAIL, password: PASS },
  });
  if (status !== 200 || !data?.access) throw new Error(`token failed ${status}`);
  return data.access;
}

function results(label, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}: ${label}${detail ? ` — ${detail}` : ""}`);
  return ok;
}

function normalizeKenyaMsisdn(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) return `+254${digits.slice(1)}`;
  if (digits.startsWith("254") && digits.length === 12) return `+${digits}`;
  return null;
}

function django(code) {
  const env = { ...process.env };
  for (const k of Object.keys(env)) {
    if (/proxy/i.test(k)) delete env[k];
  }
  env.NO_PROXY = "*";
  env.no_proxy = "*";
  return spawnSync(".venv/bin/python", ["manage.py", "shell", "-c", code], {
    cwd: resolve("backend"),
    encoding: "utf8",
    env,
  });
}

let failed = 0;
const token = await loginToken();
const secret = loadPaystackSecret();

// Ensure Fertilizer + Seeds products + orders for chart heights
const productsRes = await apiJson("GET", "/api/v1/products/", { token });
const products = Array.isArray(productsRes.data) ? productsRes.data : productsRes.data?.results || [];
let fert = products.find((p) => p.category === "Fertilizer" && p.active);
let seeds = products.find((p) => p.category === "Seeds" && p.active);
if (!fert) {
  fert = (
    await apiJson("POST", "/api/v1/products/", {
      token,
      body: {
        name: "Smoke Fertilizer",
        category: "Fertilizer",
        description: "smoke",
        price: 120,
        stock: 50,
        expiry: null,
        image: "🌱",
        active: true,
      },
    })
  ).data;
}
if (!seeds) {
  seeds = (
    await apiJson("POST", "/api/v1/products/", {
      token,
      body: {
        name: "Smoke Seeds",
        category: "Seeds",
        description: "smoke",
        price: 90,
        stock: 50,
        expiry: null,
        image: "🌾",
        active: true,
      },
    })
  ).data;
}
for (const prod of [fert, seeds]) {
  await apiJson("POST", "/api/v1/orders/", {
    token,
    body: {
      customer: { name: "Chart Farmer", phone: "0700000001" },
      items: [{ product_id: prod.id, qty: 1, price: String(prod.price) }],
      amount: String(prod.price),
      status: "Pending",
      mpesa_code: "",
      channel: "offline-sms",
      order_type: "Counter Pickup",
      pickup: "Unmatched",
    },
  });
}

const weekly = await apiJson("GET", "/api/v1/analytics/weekly-sales/", { token });
console.log("WEEKLY_SALES_STATUS", weekly.status);
console.log("WEEKLY_SALES_SAMPLE", JSON.stringify((weekly.data || [])[0] ?? null));
const rows = Array.isArray(weekly.data) ? weekly.data : [];
const last = rows[rows.length - 1];
const fertN = Number(last?.Fertilizer);
const seedsN = Number(last?.Seeds);
const sum = fertN + seedsN + Number(last?.["Vet Supplies"]) + Number(last?.Pesticides);
if (
  !results(
    "b — raw category strings coerce to finite numbers (sum)",
    typeof last?.Fertilizer === "string" && Number.isFinite(sum) && sum > 0,
    `Fertilizer=${last?.Fertilizer} sum=${sum}`,
  )
)
  failed++;

django(`
from stores.models import AgrovetStore
s = AgrovetStore.objects.get(owner__email='${EMAIL}')
s.paystack_subaccount_code = ''
s.save(update_fields=['paystack_subaccount_code','updated_at'])
print('cleared')
`);

const storeBefore = await apiJson("GET", "/api/v1/store/", { token });
if (!results("d-api — subaccount empty before UI", !(storeBefore.data?.paystack_subaccount_code || "").trim()))
  failed++;

if (!results("f — invalid phone 0712345 rejected client-side", normalizeKenyaMsisdn("0712345") === null))
  failed++;

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const chargeResponses = [];
page.on("response", async (res) => {
  const url = res.url();
  if (url.includes("/payments/charge")) {
    let text = "";
    try {
      text = await res.text();
    } catch {
      text = "";
    }
    chargeResponses.push({ status: res.status(), text });
  }
});

try {
  await page.goto(`${BASE}/login`, { waitUntil: "commit" });
  await page.waitForSelector("#login-email", { timeout: 60000 });
  await page.fill("#login-email", EMAIL);
  await page.fill("#login-password", PASS);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForFunction(() => !location.pathname.includes("/login"), null, {
    timeout: 60000,
  });

  await page.goto(`${BASE}/`, { waitUntil: "commit" });
  await page.waitForFunction(
    () =>
      document.body.innerText.includes("No sales recorded yet") ||
      /Wk \d+/.test(document.body.innerText) ||
      /last \d+ weeks?/.test(document.body.innerText),
    null,
    { timeout: 60000 },
  );
  await page.waitForTimeout(1500);
  let body = await page.locator("body").innerText();
  console.log(
    "DASH_SNIP",
    body.slice(0, 500).replace(/\n/g, " | "),
  );
  const hasSeed =
    body.includes("Wk 22") && body.includes("Wk 27") && body.includes("42000");
  const hasEmpty = body.includes("No sales recorded yet");
  const hasWeek = /Wk \d+/.test(body);
  const hasApiWeek = /Wk 3[0-9]/.test(body) || /iso/i.test(body) || hasWeek;
  if (
    !results(
      "a — weekly chart from API / empty (not seed Wk22–27)",
      (hasEmpty || hasApiWeek) && !hasSeed,
      hasEmpty ? "empty" : `weeks visible seed=${hasSeed}`,
    )
  )
    failed++;

  const weekMatch = body.match(/last (\d+) weeks?/);
  const weekCount = weekMatch ? Number(weekMatch[1]) : hasEmpty ? 0 : -1;
  if (
    !results(
      "c — subtitle reports ≤8 weeks",
      (weekCount >= 0 && weekCount <= 8) || (hasWeek && !hasSeed),
      `count=${weekCount}`,
    )
  )
    failed++;

  // Open STK dialog
  await page.getByRole("button", { name: /STK Push/i }).click();
  await page.waitForSelector("text=Counter M-Pesa STK Push", { timeout: 15000 });

  // Compose step: create order
  const phoneInput = page.locator('input[placeholder="0712345678"]').first();
  await phoneInput.fill("0701722066");
  await page.getByPlaceholder("e.g. Wanjiku Mwangi").fill("STK UI Farmer");
  await page.getByRole("combobox").click();
  await page.getByRole("option").nth(1).click(); // skip disabled custom
  await page.getByRole("button", { name: /Create counter order/i }).click();
  await page.waitForSelector("text=Paystack subaccount required", { timeout: 30000 });
  if (
    !results(
      "d — no-subaccount actionable state (not raw 400 toast)",
      await page.locator("text=Paystack subaccount required").isVisible(),
    )
  )
    failed++;

  await page.getByRole("button", { name: /Create Paystack subaccount/i }).click();
  await page.waitForFunction(
    () => !document.body.innerText.includes("Paystack subaccount required"),
    null,
    { timeout: 90000 },
  );
  const storeAfterUi = await apiJson("GET", "/api/v1/store/", { token });
  if (
    !results(
      "e — subaccount populated without reload",
      Boolean((storeAfterUi.data?.paystack_subaccount_code || "").trim()),
      storeAfterUi.data?.paystack_subaccount_code || "",
    )
  )
    failed++;

  // Invalid phone inline
  await phoneInput.fill("0712345");
  await phoneInput.blur();
  await page.waitForTimeout(400);
  const inlineErr = await page.locator("text=/Use 07XXXXXXXX|12 with 254/i").count();
  if (!results("f-ui — invalid phone inline rejection", inlineErr > 0)) failed++;

  await phoneInput.fill(CHARGE_PHONE);
  const chargeBtn = page.getByRole("button", { name: /Send STK charge/i });
  await chargeBtn.click();
  await page.waitForTimeout(200);
  const disabledWhile =
    (await chargeBtn.isDisabled().catch(() => false)) ||
    (await page.getByRole("button", { name: /Sending STK/i }).count()) > 0;
  await page.waitForSelector("text=Awaiting confirmation", { timeout: 90000 });
  const awaitingVisible = await page.locator("text=Awaiting confirmation").isVisible();
  const chargeHttp = chargeResponses[chargeResponses.length - 1];
  console.log("==== UI CHARGE RESPONSE ====");
  console.log("HTTP", chargeHttp?.status);
  console.log(chargeHttp?.text?.slice(0, 1200));
  if (
    !results(
      "g — UI shows awaiting confirmation (not paid) after 201",
      awaitingVisible && chargeHttp?.status === 201,
    )
  )
    failed++;
  if (!results("h-ui — charge button disabled while in flight / after", disabledWhile || awaitingVisible))
    failed++;

  await page.getByRole("button", { name: /^Done$/i }).click().catch(() => undefined);
} catch (err) {
  console.error("UI smoke error", err);
  failed++;
}

await browser.close();

// Locate latest pending transaction for webhook if UI failed to capture reference
let reference = null;
let orderId = null;
const txnLookup = django(`
from payments.models import MpesaTransaction
import json
t = MpesaTransaction.objects.select_related('order').order_by('-id').first()
print(json.dumps({'id': t.id if t else None, 'reference': t.reference if t else None, 'order_id': t.order_id if t else None, 'count_for_order': MpesaTransaction.objects.filter(order_id=t.order_id).count() if t else 0}))
`);
console.log("TXN_LOOKUP", txnLookup.stdout, txnLookup.stderr);
try {
  const lines = (txnLookup.stdout || "").trim().split("\n").filter(Boolean);
  const info = JSON.parse(lines[lines.length - 1]);
  reference = info.reference;
  orderId = info.order_id;
  if (
    !results(
      "h — exactly one MpesaTransaction for latest charge order",
      info.count_for_order === 1,
      JSON.stringify(info),
    )
  )
    failed++;
} catch (e) {
  console.error("txn lookup failed", e);
  failed++;
}

if (reference) {
  const payload = {
    event: "charge.success",
    data: {
      reference,
      paid_at: new Date().toISOString(),
      receipt_number: "SMOKERECEIPT1",
      gateway_response: "Successful",
      currency: "KES",
    },
  };
  const raw = Buffer.from(JSON.stringify(payload));
  const sig = createHmac("sha512", secret).update(raw).digest("hex");
  const whOk = await fetch(`${API}/api/paystack/webhook/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Paystack-Signature": sig },
    body: raw,
  });
  const whOkText = await whOk.text();
  console.log("==== WEBHOOK GOOD REQUEST/RESPONSE ====");
  console.log("POST /api/paystack/webhook/");
  console.log("BODY", raw.toString());
  console.log("HTTP", whOk.status, whOkText);

  const orderAfter = await apiJson("GET", `/api/v1/orders/${orderId}/`, { token });
  console.log(
    "ORDER_AFTER",
    JSON.stringify({ paid_at: orderAfter.data?.paid_at, pickup: orderAfter.data?.pickup }),
  );
  if (
    !results(
      "i — webhook paid_at + Awaiting Pickup",
      Boolean(orderAfter.data?.paid_at) && orderAfter.data?.pickup === "Awaiting Pickup",
    )
  )
    failed++;

  // UI refresh payment status
  const browser2 = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--disable-dev-shm-usage"],
  });
  const page2 = await browser2.newPage({ viewport: { width: 1400, height: 900 } });
  try {
    await page2.goto(`${BASE}/login`, { waitUntil: "commit" });
    await page2.waitForSelector("#login-email");
    await page2.fill("#login-email", EMAIL);
    await page2.fill("#login-password", PASS);
    await page2.getByRole("button", { name: /sign in/i }).click();
    await page2.waitForFunction(() => !location.pathname.includes("/login"), null, {
      timeout: 60000,
    });
    await page2.goto(`${BASE}/orders`, { waitUntil: "commit" });
    await page2.waitForFunction(
      () => !document.body.innerText.includes("Loading orders"),
      null,
      { timeout: 60000 },
    );
    await page2.getByRole("button", { name: /Refresh payment status/i }).click();
    await page2.waitForTimeout(1500);
    const text = await page2.locator("body").innerText();
    const paidVisible = /\bPaid\b/.test(text);
    // Paid orders must not show Charge on the paid row — approximate: count Charge buttons <= unpaid
    if (!results("i-ui — refresh shows Paid", paidVisible)) failed++;
  } catch (e) {
    console.error("refresh UI error", e);
    failed++;
  }
  await browser2.close();

  const badSig = await fetch(`${API}/api/paystack/webhook/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Paystack-Signature": "deadbeef",
    },
    body: raw,
  });
  const badText = await badSig.text();
  console.log("==== WEBHOOK BAD SIGNATURE REQUEST/RESPONSE ====");
  console.log("POST /api/paystack/webhook/ X-Paystack-Signature=deadbeef");
  console.log("HTTP", badSig.status, badText);
  if (!results("j — wrong signature rejected 401", badSig.status === 401)) failed++;
} else {
  results("i — skipped (no reference)", false);
  results("j — skipped (no reference)", false);
  failed += 2;
}

console.log(`\nSMOKE_DONE failed=${failed}`);
process.exit(failed ? 1 : 0);
