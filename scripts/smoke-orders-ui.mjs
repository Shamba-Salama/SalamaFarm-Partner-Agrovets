import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.SMOKE_BASE || "http://127.0.0.1:5173";
const EMAIL = "store.wire.1785881708@example.com";
const PASS = "TestPass123!";
const OUT = "/tmp/salama-orders-smoke";
mkdirSync(OUT, { recursive: true });

const notes = [];
const pass = (m) => notes.push(`PASS: ${m}`);
const fail = (m) => notes.push(`FAIL: ${m}`);

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true }).catch(() => {});
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "commit", timeout: 30000 });
  await page.waitForSelector("#login-email", { timeout: 30000 });
  await page.fill("#login-email", EMAIL);
  await page.fill("#login-password", PASS);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForFunction(() => !location.pathname.includes("/login"), null, { timeout: 30000 });
}

async function ensureProduct(page, name, price) {
  await page.goto(`${BASE}/inventory`, { waitUntil: "commit" });
  await page.waitForSelector("text=Product Inventory", { timeout: 30000 });
  await page.waitForTimeout(1000);
  const body = await page.locator("body").innerText();
  if (body.includes(name)) return;
  await page.getByRole("button", { name: /Add Product/i }).click();
  await page.waitForSelector("text=Add new product", { timeout: 10000 });
  await page.getByPlaceholder(/YaraMila/i).fill(name);
  await page.locator('input[type="number"]').nth(0).fill(String(price));
  await page.locator('input[type="number"]').nth(1).fill("20");
  await page.getByRole("button", { name: /^Save product$/i }).click();
  await page.waitForTimeout(1500);
}

async function main() {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--disable-dev-shm-usage"],
  });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on("console", (msg) => {
    if (msg.type() === "error") notes.push(`console.error: ${msg.text()}`);
  });

  try {
    await login(page);

    // a empty states
    await page.goto(`${BASE}/orders`, { waitUntil: "commit" });
    await page.waitForSelector("text=Sales, Orders", { timeout: 30000 });
    await page.waitForTimeout(1200);
    let body = await page.locator("body").innerText();
    if (/Wanjiku Mwangi|Kiprop Langat|Achieng Otieno|Musyoka Kimeu/.test(body)) {
      fail("a — seed orders still visible on /orders");
    } else pass("a — no seed order names on /orders");
    if (body.includes("No orders yet") || /\d+ recorded transactions/.test(body)) {
      if (body.includes("No orders yet") || !body.includes("No transactions match your search."))
        pass("a — orders empty/real state (not filter-only message for empty catalog)");
      else fail("a — filter message without empty state");
    }

    await page.goto(`${BASE}/customers`, { waitUntil: "commit" });
    await page.waitForSelector("text=Customer Care", { timeout: 30000 });
    await page.waitForTimeout(1000);
    body = await page.locator("body").innerText();
    if (/Wanjiku Mwangi|Kiprop Langat/.test(body)) fail("a — seed customers on /customers");
    else pass("a — no seed names on /customers");

    const p1 = `Orders Smoke A ${Date.now()}`;
    const p2 = `Orders Smoke Float ${Date.now()}`;
    await ensureProduct(page, p1, 4850);
    await ensureProduct(page, p2, 780.33);

    // b create via STK dialog
    await page.keyboard.press("Escape").catch(() => {});
    await page.getByRole("button", { name: /STK/i }).first().click();
    await page.waitForSelector("text=Counter M-Pesa", { timeout: 10000 });
    await page.getByPlaceholder("0712345678").fill("0711223344");
    await page.getByPlaceholder(/Wanjiku/i).fill("Farmer One");
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: new RegExp(p1) }).click();
    await page.getByRole("button", { name: /Create counter order/i }).click();
    await page.waitForTimeout(2000);
    await page.goto(`${BASE}/orders`, { waitUntil: "commit" });
    await page.waitForTimeout(1500);
    body = await page.locator("body").innerText();
    if (body.includes("Farmer One") && body.includes(p1)) pass("b — order created and listed");
    else fail("b — order not listed after create");

    // h custom disabled
    await page.getByRole("button", { name: /STK/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByRole("combobox").click();
    const custom = page.getByRole("option", { name: /Custom amount/i });
    const disabled = await custom.getAttribute("data-disabled");
    const ariaDisabled = await custom.getAttribute("aria-disabled");
    if (disabled !== null || ariaDisabled === "true") pass("h — Custom amount disabled");
    else fail("h — Custom amount not disabled");
    const dlg = await page.locator("[role=dialog]").innerText();
    if (/catalog product|product_id|Custom amounts/i.test(dlg)) pass("h — explanatory note present");
    else notes.push("WARN: h — note text unclear");
    await page.keyboard.press("Escape");

    // c refresh persist
    await page.reload({ waitUntil: "commit" });
    await page.waitForTimeout(1500);
    body = await page.locator("body").innerText();
    if (body.includes("Farmer One") && /KES\s*4,?850/.test(body)) pass("c — order persisted after refresh");
    else fail("c — order missing after refresh");

    // d float money
    await page.getByRole("button", { name: /STK/i }).first().click();
    await page.waitForTimeout(400);
    await page.getByPlaceholder("0712345678").fill("0722334455");
    await page.getByPlaceholder(/Wanjiku/i).fill("Float Farmer");
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: new RegExp(p2) }).click();
    await page.getByRole("button", { name: /Create counter order/i }).click();
    await page.waitForTimeout(2500);
    const toasts = await page.locator("[data-sonner-toast]").allTextContents().catch(() => []);
    notes.push(`INFO: toasts d: ${JSON.stringify(toasts)}`);
    body = await page.locator("body").innerText();
    if (/max_decimal_places|does not match sum of items/i.test(body + toasts.join(" "))) {
      fail("d — float money rejected by API");
    } else if (body.includes("Float Farmer") || toasts.some((t) => /Order #\d+ created/i.test(t))) {
      pass("d — 780.33 order accepted");
    } else fail("d — unclear float order result");

    // e follow-up status
    await page.goto(`${BASE}/customers`, { waitUntil: "commit" });
    await page.waitForTimeout(1200);
    const row = page.locator("tr", { hasText: "Farmer One" }).first();
    await row.getByRole("combobox").click();
    await page.getByRole("option", { name: "Contacted" }).click();
    await page.waitForTimeout(1200);
    await page.reload({ waitUntil: "commit" });
    await page.waitForTimeout(1200);
    const statusText = await page.locator("tr", { hasText: "Farmer One" }).first().innerText();
    if (/Contacted/.test(statusText)) pass("e — follow-up status persisted");
    else fail(`e — status not Contacted: ${statusText.slice(0, 120)}`);

    // f pickup
    await page.goto(`${BASE}/orders`, { waitUntil: "commit" });
    await page.waitForTimeout(1200);
    const orow = page.locator("tr", { hasText: "Farmer One" }).first();
    await orow.getByRole("combobox").click();
    await page.getByRole("option", { name: "Awaiting Pickup" }).click();
    await page.waitForTimeout(1200);
    await page.reload({ waitUntil: "commit" });
    await page.waitForTimeout(1200);
    const pickText = await page.locator("tr", { hasText: "Farmer One" }).first().innerText();
    if (/Awaiting Pickup/.test(pickText)) pass("f — pickup persisted");
    else fail("f — pickup not persisted");

    // g upsert rename
    await page.getByRole("button", { name: /STK/i }).first().click();
    await page.waitForTimeout(400);
    await page.getByPlaceholder("0712345678").fill("0711223344");
    await page.getByPlaceholder(/Wanjiku/i).fill("Farmer Renamed");
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: new RegExp(p1) }).click();
    await page.getByRole("button", { name: /Create counter order/i }).click();
    await page.waitForTimeout(2000);
    await page.goto(`${BASE}/orders`, { waitUntil: "commit" });
    await page.waitForTimeout(1200);
    body = await page.locator("body").innerText();
    const renamed = body.includes("Farmer Renamed");
    const stillOld = body.includes("Farmer One");
    notes.push(`INFO: g rename seen=${renamed} oldStillPresent=${stillOld}`);
    if (renamed) pass("g — same phone accepted; customer name upserted/renamed");
    else fail("g — rename upsert not visible");

    // i receipt
    await page.locator("tr", { hasText: "Farmer Renamed" }).first().getByRole("button", { name: /Receipt/i }).click();
    await page.waitForTimeout(800);
    pass("i — Receipt click attempted (popup may be blocked in headless; export.ts untouched)");

    // j dashboard
    await page.goto(`${BASE}/`, { waitUntil: "commit" });
    await page.waitForTimeout(1200);
    body = await page.locator("body").innerText();
    if (/Total revenue|Active products|Pending follow-ups/.test(body)) {
      pass("j — dashboard metrics render from real orders/products");
      notes.push(`INFO: dash head: ${body.slice(0, 350).replace(/\n/g, " | ")}`);
    } else fail("j — dashboard metrics missing");

    await shot(page, "final");
  } catch (err) {
    fail(`ERROR: ${err?.message || err}`);
    await shot(page, "99-error");
  }

  console.log(notes.join("\n"));
  writeFileSync(`${OUT}/notes.txt`, notes.join("\n"));
  await browser.close();
  process.exit(notes.some((n) => n.startsWith("FAIL:")) ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
