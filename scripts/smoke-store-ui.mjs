import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.SMOKE_BASE || "http://127.0.0.1:5173";
const EMAIL = "store.wire.1785881708@example.com";
const PASS = "TestPass123!";
const OUT = "/tmp/salama-smoke";

mkdirSync(OUT, { recursive: true });

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true }).catch(() => {});
}

async function main() {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--disable-dev-shm-usage"],
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  const notes = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") notes.push(`console.error: ${msg.text()}`);
  });
  page.on("pageerror", (err) => notes.push(`pageerror: ${err.message}`));
  page.on("requestfailed", (req) => {
    notes.push(`requestfailed: ${req.method()} ${req.url()} :: ${req.failure()?.errorText}`);
  });

  try {
    notes.push(`BASE=${BASE}`);
    await page.goto(`${BASE}/login`, { waitUntil: "commit", timeout: 30000 });
    await page.waitForSelector("#login-email", { timeout: 30000 });
    await shot(page, "01-login");

    await page.fill("#login-email", EMAIL);
    await page.fill("#login-password", PASS);
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForFunction(() => !location.pathname.includes("/login"), null, {
      timeout: 30000,
    });
    notes.push(`after login URL: ${page.url()}`);
    // Wait for store hydrate / banner
    await page.waitForSelector("text=/Verified Merchant|Pending Verification/", {
      timeout: 30000,
    });
    await shot(page, "02-dashboard");

    const body = await page.locator("body").innerText();
    notes.push(
      body.includes("Rift Valley")
        ? "OK: page shows Rift Valley store data"
        : `WARN: Rift Valley not found. Head: ${body.slice(0, 300).replace(/\n/g, " | ")}`,
    );
    notes.push(
      body.includes("Green Valley Agrovet")
        ? "FAIL: still showing Green Valley seed name"
        : "OK: no Green Valley seed name",
    );

    const statusBtn = page.getByRole("button", { name: /Store Status:/i });
    await statusBtn.waitFor({ timeout: 15000 });
    const before = (await statusBtn.innerText()).trim();
    notes.push(`status before: ${before}`);
    await statusBtn.click();
    await page.waitForTimeout(1500);
    const after = (await statusBtn.innerText()).trim();
    notes.push(`status after toggle: ${after}`);
    notes.push(before !== after ? "OK: open toggle flipped UI" : "WARN: status text unchanged");
    await shot(page, "03-toggled");

    await page.goto(`${BASE}/settings`, { waitUntil: "commit", timeout: 30000 });
    await page.waitForSelector("text=Store profile", { timeout: 30000 });
    await shot(page, "04-settings");

    const nameInput = page.locator("form input, input").first();
    // Prefer explicitly labeled field
    const labeled = page.getByLabel("Store name");
    const field = (await labeled.count()) ? labeled : nameInput;
    const currentName = await field.inputValue();
    const newName = currentName.includes("BrowserEdit")
      ? "Rift Valley Agrovet HQ"
      : `${currentName.replace(/ BrowserEdit$/, "")} BrowserEdit`;
    await field.fill(newName);
    await page.getByRole("button", { name: /save changes/i }).click();
    await page.waitForTimeout(1500);
    notes.push(`saved name as: ${newName}`);
    await shot(page, "05-saved");

    await page.reload({ waitUntil: "commit", timeout: 30000 });
    await page.waitForSelector("text=Store profile", { timeout: 30000 });
    const afterReload = await (await labeled.count() ? labeled : page.locator("input").first()).inputValue();
    notes.push(
      afterReload === newName
        ? `OK: name persisted after refresh (${afterReload})`
        : `FAIL: expected ${newName}, got ${afterReload}`,
    );

    const license = page.locator("#license-file");
    notes.push(
      (await license.count()) && (await license.isDisabled())
        ? "OK: license upload present and disabled"
        : "WARN: license upload control missing or enabled",
    );
    const gap = await page.locator("body").innerText();
    notes.push(gap.includes("Known gap") ? "OK: known gap note visible" : "WARN: known gap note missing");
    await shot(page, "06-reload");
  } catch (err) {
    notes.push(`ERROR: ${err?.message || err}`);
    await shot(page, "99-error");
    console.log(notes.join("\n"));
    await browser.close();
    process.exit(1);
  }

  console.log(notes.join("\n"));
  await browser.close();
  const failed = notes.some((n) => n.startsWith("FAIL:") || n.startsWith("ERROR:"));
  process.exit(failed ? 1 : 0);
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
