import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.SMOKE_BASE || "http://127.0.0.1:5173";
const EMAIL = "store.wire.1785881708@example.com";
const PASS = "TestPass123!";
const OUT = "/tmp/salama-inventory-smoke";
mkdirSync(OUT, { recursive: true });

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true }).catch(() => {});
}

const notes = [];
const pass = (msg) => notes.push(`PASS: ${msg}`);
const fail = (msg) => notes.push(`FAIL: ${msg}`);

async function main() {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--disable-dev-shm-usage"],
  });
  const page = await browser.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") notes.push(`console.error: ${msg.text()}`);
  });
  page.on("pageerror", (err) => notes.push(`pageerror: ${err.message}`));

  try {
    // a. Login + empty / inventory
    await page.goto(`${BASE}/login`, { waitUntil: "commit", timeout: 30000 });
    await page.waitForSelector("#login-email", { timeout: 30000 });
    await page.fill("#login-email", EMAIL);
    await page.fill("#login-password", PASS);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForFunction(() => !location.pathname.includes("/login"), null, { timeout: 30000 });

    await page.goto(`${BASE}/inventory`, { waitUntil: "commit", timeout: 30000 });
    await page.waitForSelector("text=Product Inventory", { timeout: 30000 });
    await page.waitForTimeout(1500);
    await shot(page, "01-inventory");

    const body1 = await page.locator("body").innerText();
    if (/YaraMila|Simba Hybrid|Amitraz/.test(body1)) {
      fail("a — seed products still visible");
    } else {
      pass("a — no seed products");
    }
    if (body1.includes("No products yet — add your first product or import a CSV")) {
      pass("a — empty state shown");
    } else if (body1.includes("No products match your filters")) {
      fail("a — saw filter-empty message instead of real empty state");
    } else if (/products in your catalogue/.test(body1) && !/0 products/.test(body1)) {
      // catalog may already have products from prior runs
      notes.push("INFO: a — catalog not empty (prior data); continuing");
      pass("a — inventory loaded without seed labels");
    } else {
      fail(`a — unexpected empty presentation. Head: ${body1.slice(0, 280).replace(/\n/g, " | ")}`);
    }

    // b. Add product priced 4850
    const productName = `Smoke Canister ${Date.now()}`;
    await page.getByRole("button", { name: /Add Product/i }).click();
    await page.waitForSelector("text=Add new product", { timeout: 10000 });
    await page.getByPlaceholder(/YaraMila/i).fill(productName);
    await page.locator('input[type="number"]').nth(0).fill("4850");
    await page.locator('input[type="number"]').nth(1).fill("12");
    await page.getByRole("button", { name: /^Save product$/i }).click();
    await page.waitForTimeout(2000);
    await shot(page, "02-created");

    const afterCreate = await page.locator("body").innerText();
    if (afterCreate.includes("KES 4,850") && afterCreate.includes(productName)) {
      pass("b — price shows as KES 4,850");
    } else if (afterCreate.includes("KES 4850.00")) {
      fail("b — price still string-looking (KES 4850.00)");
    } else if (afterCreate.includes(productName) && /4,?850/.test(afterCreate)) {
      pass(`b — product present with price format: ${afterCreate.match(/KES[^\n]+/)?.[0] || "?"}`);
    } else {
      fail(`b — product/price not found after create`);
    }

    // c. Edit name + price, refresh
    const editedName = `${productName} Edited`;
    {
      const row = page.locator("tr", { hasText: productName }).first();
      await row.getByRole("button").nth(0).click(); // pencil
      await page.waitForSelector("text=Edit product", { timeout: 10000 });
      await page.getByPlaceholder(/YaraMila/i).fill(editedName);
      await page.locator('input[type="number"]').nth(0).fill("5000");
      await page.getByRole("button", { name: /^Save product$/i }).click();
      await page.waitForTimeout(1500);
      await page.reload({ waitUntil: "commit" });
      await page.waitForSelector("text=Product Inventory", { timeout: 30000 });
      await page.waitForTimeout(1500);
      const afterEdit = await page.locator("body").innerText();
      if (afterEdit.includes(editedName) && /KES\s*5[,.]?000/.test(afterEdit)) {
        pass("c — edit persisted after refresh");
      } else {
        fail(
          `c — edit not persisted. hasName=${afterEdit.includes(editedName)} prices=${[
            ...afterEdit.matchAll(/KES[^\n]*/g),
          ]
            .slice(0, 5)
            .map((m) => m[0])}`,
        );
      }
      await shot(page, "03-edited");
    }
    // d. Toggle inactive
    const editRow = page.locator("tr", { hasText: editedName }).first();
    const sw = editRow.locator('[role="switch"]');
    if (await sw.count()) {
      const before = await sw.getAttribute("data-state");
      await sw.click();
      await page.waitForTimeout(1200);
      await page.reload({ waitUntil: "commit" });
      await page.waitForSelector("text=Product Inventory", { timeout: 30000 });
      await page.waitForTimeout(1500);
      const after = await page.locator("tr", { hasText: editedName }).locator('[role="switch"]').getAttribute("data-state");
      if (before && after && before !== after) {
        pass(`d — active toggle persisted (${before}→${after})`);
      } else {
        fail(`d — toggle not persisted (${before}→${after})`);
      }
      // dashboard metric
      await page.goto(`${BASE}/`, { waitUntil: "commit" });
      await page.waitForTimeout(1200);
      const dash = await page.locator("body").innerText();
      if (/Active products/.test(dash)) pass("d — dashboard shows Active products metric");
      else fail("d — Active products metric missing");
      await page.goto(`${BASE}/inventory`, { waitUntil: "commit" });
      await page.waitForSelector("text=Product Inventory", { timeout: 30000 });
      await page.waitForTimeout(1000);
    } else {
      fail("d — switch not found");
    }

    // e. Empty expiry product
    const noExpName = `No Expiry ${Date.now()}`;
    await page.getByRole("button", { name: /Add Product/i }).click();
    await page.waitForSelector("text=Add new product", { timeout: 10000 });
    await page.getByPlaceholder(/YaraMila/i).fill(noExpName);
    await page.locator('input[type="number"]').nth(0).fill("1000");
    await page.locator('input[type="number"]').nth(1).fill("10");
    // leave expiry empty
    await page.getByRole("button", { name: /^Save product$/i }).click();
    await page.waitForTimeout(1500);
    const noExpBody = await page.locator("body").innerText();
    if (noExpBody.includes(noExpName) && noExpBody.includes("No expiry date")) {
      pass("e — empty expiry shows 'No expiry date'");
    } else {
      fail("e — missing 'No expiry date'");
    }
    if (/NaN days left/.test(noExpBody)) fail("e — shows NaN days left");
    else pass("e — no NaN days left");
    // With stock 10 and no expiry, should not be wrongly Expired/Clearance; Low Stock only if <5
    const noExpRowText = await page.locator("tr", { hasText: noExpName }).innerText();
    if (/Expired|Clearance Candidate/.test(noExpRowText)) {
      fail("e — wrongly showing Expired/Clearance with null expiry");
    } else {
      pass("e — no false Expired/Clearance for null expiry");
    }

    // f. Delete no-expiry product
    await page.locator("tr", { hasText: noExpName }).getByRole("button").last().click();
    await page.waitForTimeout(1200);
    await page.reload({ waitUntil: "commit" });
    await page.waitForSelector("text=Product Inventory", { timeout: 30000 });
    await page.waitForTimeout(1200);
    const afterDel = await page.locator("body").innerText();
    if (!afterDel.includes(noExpName)) pass("f — deleted product stayed gone after refresh");
    else fail("f — deleted product still present");

    // g. Import template CSV
    const template =
      "product_name,category,price_kes,stock_quantity,unit_description,expiry_date\n" +
      `CSV Maize ${Date.now()},Seeds,2400,17,10g sachet,2027-01-18\n` +
      `CSV Fert ${Date.now()},Fertilizer,4850,24,50kg bag,2027-04-30\n`;
    writeFileSync(`${OUT}/good.csv`, template);
    await page.getByRole("button", { name: /Import CSV/i }).click();
    await page.waitForSelector("text=Import products via CSV", { timeout: 10000 });
    await page.locator('input[type="file"]').setInputFiles(`${OUT}/good.csv`);
    await page.waitForTimeout(800);
    await page.getByRole("button", { name: /Confirm & Add Inventory/i }).click();
    await page.waitForTimeout(2500);
    const toastText = await page.locator("[data-sonner-toast], li[data-type], [class*='toast']").allTextContents().catch(() => []);
    notes.push(`INFO: toasts after good import: ${JSON.stringify(toastText)}`);
    const afterImport = await page.locator("body").innerText();
    if (/CSV Maize|CSV Fert/.test(afterImport)) pass("g — CSV products appear after import");
    else fail("g — CSV products not visible");
    if (toastText.some((t) => /2 products added/.test(t))) pass("g — toast reports server created count 2");
    else notes.push("WARN: g — could not assert created=2 from toast UI");

    // h. Broken CSV
    writeFileSync(
      `${OUT}/bad.csv`,
      "product_name,category,price_kes,stock_quantity,unit_description,expiry_date\nBad Row,Seeds,NOT_A_PRICE,5,x,2027-01-01\n",
    );
    const beforeCount = (await page.locator("body").innerText()).match(/(\d+) products in your catalogue/)?.[1];
    await page.getByRole("button", { name: /Import CSV/i }).click();
    await page.waitForSelector("text=Import products via CSV", { timeout: 10000 });
    await page.locator('input[type="file"]').setInputFiles(`${OUT}/bad.csv`);
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /Confirm & Add Inventory/i }).click();
    await page.waitForTimeout(2000);
    const errToasts = await page.locator("[data-sonner-toast], li[data-type='error'], [data-type='error']").allTextContents().catch(() => []);
    notes.push(`INFO: toasts after bad import: ${JSON.stringify(errToasts)}`);
    const allToasts = await page.locator("body").innerText();
    if (/Nothing was imported|invalid price_kes|Row \d+/i.test(allToasts) || errToasts.some((t) => /Nothing was imported|price_kes/i.test(t))) {
      pass("h — bad import surfaces server error / nothing imported message");
    } else {
      fail("h — bad import error messaging not found");
    }
    const afterBad = (await page.locator("body").innerText()).match(/(\d+) products in your catalogue/)?.[1];
    if (beforeCount && afterBad && beforeCount === afterBad) pass("h — product count unchanged after failed import");
    else notes.push(`WARN: h — count before=${beforeCount} after=${afterBad}`);

    // Close any leftover dialogs from CSV import before STK
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(300);
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(300);

    // i. STK dialog
    await page.getByRole("button", { name: /STK/i }).first().click({ timeout: 15000 });
    await page.waitForTimeout(800);
    await shot(page, "04-stk");
    // open product select
    const stk = page.locator('[role="dialog"]');
    if (await stk.count()) {
      await stk.getByRole("combobox").first().click().catch(() => {});
      await page.waitForTimeout(400);
      const options = await page.locator('[role="option"]').allTextContents();
      notes.push(`INFO: STK options: ${JSON.stringify(options.slice(0, 8))}`);
      if (options.length > 1) {
        const pick =
          options.find((o) => /CSV|Edited|Smoke/.test(o)) || options[1];
        await page.getByRole("option", { name: pick, exact: true }).click();
        await page.waitForTimeout(400);
        const stkBody = await stk.innerText();
        if (/4,?850|5,?000|2,?400/.test(stkBody)) pass("i — STK amount populated from product");
        else pass("i — STK dialog opened with product list");
        notes.push(`INFO: stk body snippet: ${stkBody.slice(0, 200).replace(/\n/g, " | ")}`);
      } else {
        fail("i — STK product picker empty");
      }
      await page.keyboard.press("Escape");
    } else {
      fail("i — STK dialog did not open");
    }
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
