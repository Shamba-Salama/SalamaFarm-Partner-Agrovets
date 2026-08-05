/**
 * Phase 5 smoke: messaging threads/chat (Chrome channel).
 * Does not modify earlier smoke scripts.
 */
import { chromium } from "playwright-core";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const BASE = process.env.SMOKE_BASE || "http://127.0.0.1:5173";
const API = process.env.SMOKE_API || "http://127.0.0.1:8000";
const EMAIL = "store.wire.1785881708@example.com";
const PASS = "TestPass123!";

function results(label, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}: ${label}${detail ? ` — ${detail}` : ""}`);
  return ok;
}

async function apiJson(method, path, { token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

function django(code) {
  return spawnSync(".venv/bin/python", ["manage.py", "shell", "-c", code], {
    cwd: resolve("backend"),
    encoding: "utf8",
  });
}

let failed = 0;
const token = await loginToken();

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const threadReqs = [];
page.on("request", (req) => {
  if (req.url().includes("/threads/")) threadReqs.push({ url: req.url(), t: Date.now() });
});

async function loginUi() {
  await page.goto(`${BASE}/login`, { waitUntil: "commit" });
  await page.waitForSelector("#login-email", { timeout: 60000 });
  await page.fill("#login-email", EMAIL);
  await page.fill("#login-password", PASS);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForFunction(() => !location.pathname.includes("/login"), null, {
    timeout: 60000,
  });
}

try {
  await loginUi();
  await page.goto(`${BASE}/messages`, { waitUntil: "commit" });
  await page.waitForFunction(
    () =>
      document.body.innerText.includes("No conversations yet") ||
      document.body.innerText.includes("Open chat") ||
      document.body.innerText.includes("conversations"),
    null,
    { timeout: 60000 },
  );
  await page.waitForTimeout(1000);
  let body = await page.locator("body").innerText();
  const hasSeed =
    body.includes("Wanjiku Mwangi") && body.includes("Maize leaf yellowing");
  const empty = body.includes("No conversations yet");
  const hasCards = body.includes("Open chat");
  if (
    !results(
      "a — real threads / empty (not seed Wanjiku)",
      !hasSeed && (empty || hasCards),
      hasSeed ? "seed present" : empty ? "empty" : "threads present",
    )
  )
    failed++;

  // Ensure customer + order exist
  const orders = await apiJson("GET", "/api/v1/orders/", { token });
  const orderList = Array.isArray(orders.data) ? orders.data : orders.data?.results || [];
  let order = orderList[0];
  if (!order) {
    const products = await apiJson("GET", "/api/v1/products/", { token });
    const plist = Array.isArray(products.data) ? products.data : products.data?.results || [];
    const prod = plist[0];
    const created = await apiJson("POST", "/api/v1/orders/", {
      token,
      body: {
        customer: { name: "Msg Farmer", phone: "0711223344" },
        items: [{ product_id: prod.id, qty: 1, price: String(prod.price) }],
        amount: String(prod.price),
        status: "Pending",
        mpesa_code: "",
        channel: "in-app",
        order_type: "Counter Pickup",
        pickup: "Unmatched",
      },
    });
    order = created.data;
  }
  const customerId = order.customer?.id;
  const customerName = order.customer?.name;
  console.log("ORDER", order.id, customerId, customerName);

  // Count threads for this customer before follow-ups
  const beforeThreads = await apiJson("GET", "/api/v1/threads/", { token });
  const beforeList = Array.isArray(beforeThreads.data)
    ? beforeThreads.data
    : beforeThreads.data?.results || [];
  const beforeForCust = beforeList.filter((t) => t.customer?.id === customerId).length;

  await page.goto(`${BASE}/customers`, { waitUntil: "commit" });
  await page.waitForFunction(
    () => !document.body.innerText.includes("Loading"),
    null,
    { timeout: 60000 },
  );
  await page.waitForTimeout(800);

  // Open follow-up for matching order row
  const followBtn = page.getByRole("button", { name: /follow.?up|Send follow-up|Message/i }).first();
  // Prefer the "Follow up" action if present
  const alt = page.locator("button").filter({ hasText: /Follow/i }).first();
  if ((await alt.count()) > 0) await alt.click();
  else if ((await followBtn.count()) > 0) await followBtn.click();
  else {
    // Table action - look for Send icon buttons near Pending
    await page.getByRole("button").filter({ hasText: /Send|Follow/ }).first().click();
  }

  await page.waitForSelector("text=Send follow-up to", { timeout: 15000 });
  const dlg = page.locator('[role="dialog"]');
  const gapNote = await dlg.locator("text=/Known gap|stays local/i").count();
  if (!results("i — no stale Known gap note", gapNote === 0)) failed++;
  const falseSms = await dlg.locator("text=/SMS was sent|physically sent|Bulk SMS delivery/i").count();
  // wording may mention SMS gateway not connected — that's ok; claiming sent is not
  const claimsSent = await dlg.locator("text=/SMS sent successfully|message was sent by SMS/i").count();
  if (!results("i — copy does not claim SMS transmitted", claimsSent === 0 && falseSms === 0, `falseSms=${falseSms}`))
    failed++;

  await dlg.getByRole("button", { name: /^Send follow-up$/i }).click();
  await page.waitForTimeout(2000);

  const after1 = await apiJson("GET", "/api/v1/threads/", { token });
  const list1 = Array.isArray(after1.data) ? after1.data : after1.data?.results || [];
  const forCust1 = list1.filter((t) => t.customer?.id === customerId);
  const createdThread = forCust1[0];
  if (
    !results(
      "b — follow-up creates/uses thread (201 path)",
      forCust1.length >= 1 && Boolean(createdThread?.last_message?.text),
      `count=${forCust1.length} preview=${createdThread?.last_message?.text?.slice(0, 60)}`,
    )
  )
    failed++;

  await page.goto(`${BASE}/messages`, { waitUntil: "commit" });
  await page.waitForTimeout(1500);
  body = await page.locator("body").innerText();
  const previewOk =
    createdThread &&
    body.includes(createdThread.last_message.text.slice(0, 40)) &&
    !body.includes("No messages yet");
  // If multiple threads, "No messages yet" might still appear elsewhere — check card has You:
  const hasYouPreview = /You: /.test(body);
  if (
    !results(
      "c — /messages preview from lastMessage",
      hasYouPreview || previewOk,
      hasYouPreview ? "You: preview" : "missing preview",
    )
  )
    failed++;

  // Second follow-up — must not create second thread
  await page.goto(`${BASE}/customers`, { waitUntil: "commit" });
  await page.waitForTimeout(1000);
  const alt2 = page.locator("button").filter({ hasText: /Follow/i }).first();
  await alt2.click();
  await page.waitForSelector("text=Send follow-up to", { timeout: 15000 });
  await page.locator('[role="dialog"]').getByRole("button", { name: /^Send follow-up$/i }).click();
  await page.waitForTimeout(2000);

  const after2 = await apiJson("GET", "/api/v1/threads/", { token });
  const list2 = Array.isArray(after2.data) ? after2.data : after2.data?.results || [];
  const forCust2 = list2.filter((t) => t.customer?.id === customerId);
  if (
    !results(
      "d — second follow-up does not duplicate thread",
      forCust2.length === 1,
      `count=${forCust2.length} (before=${beforeForCust})`,
    )
  )
    failed++;

  const threadId = forCust2[0]?.id;
  await page.goto(`${BASE}/messages`, { waitUntil: "commit" });
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: /Open chat/i }).first().click();
  await page.waitForSelector("text=Loading conversation", { timeout: 5000 }).catch(() => undefined);
  await page.waitForFunction(
    () => !document.body.innerText.includes("Loading conversation"),
    null,
    { timeout: 30000 },
  );
  const drawerBody = await page.locator('[role="dialog"], .sm\\:max-w-md').first().innerText().catch(() => page.locator("body").innerText());
  const detail = await apiJson("GET", `/api/v1/threads/${threadId}/`, { token });
  const msgCount = detail.data?.messages?.length ?? 0;
  if (
    !results(
      "e — drawer loads full history",
      msgCount >= 2 && !String(drawerBody).includes("Loading conversation"),
      `messages=${msgCount}`,
    )
  )
    failed++;

  const sendBox = page.getByPlaceholder(/Reply in app|Record reply/i);
  await sendBox.fill("Phase5 drawer reply smoke");
  await page.locator('button[type="submit"]').last().click();
  await page.waitForTimeout(1500);
  const afterSend = await apiJson("GET", `/api/v1/threads/${threadId}/`, { token });
  const unreadAfterStore = afterSend.data?.unread;
  const hasReply = (afterSend.data?.messages || []).some((m) =>
    m.text.includes("Phase5 drawer reply smoke"),
  );
  if (!results("f — drawer send persists", hasReply, `msgs=${afterSend.data?.messages?.length}`))
    failed++;
  if (!results("g — store send does not bump unread", Number(unreadAfterStore) === 0, `unread=${unreadAfterStore}`))
    failed++;

  // Admin: farmer message + unread=2
  const admin = django(`
from messaging.models import Thread, ChatMessage
t = Thread.objects.get(pk=${threadId})
ChatMessage.objects.create(thread=t, sender=ChatMessage.Sender.FARMER, text='Admin farmer probe ${Date.now()}')
t.unread = 2
t.save(update_fields=['unread', 'updated_at'])
print('ok', t.unread)
`);
  console.log("ADMIN", admin.stdout.trim(), admin.stderr.trim());

  // Wait for poll (~50s) or refresh messages page
  await page.goto(`${BASE}/messages`, { waitUntil: "commit" });
  await page.waitForTimeout(2000);
  // Force a refresh via navigation reload after short wait — also wait up to 55s for poll toast
  try {
    await page.waitForFunction(
      () => {
        const text = document.body.innerText;
        return /\\b2\\b/.test(text) && text.includes("unread");
      },
      null,
      { timeout: 60000 },
    );
  } catch {
    /* may need harder refresh */
  }
  body = await page.locator("body").innerText();
  const badgeOk = /2 unread|\\n2\\n/.test(body) || body.includes("2 unread") || /\bunread\b/.test(body);
  // Check API-backed badge after client refreshThreads from poll
  const thr = await apiJson("GET", "/api/v1/threads/", { token });
  const live = (Array.isArray(thr.data) ? thr.data : []).find((t) => t.id === threadId);
  console.log("LIVE_UNREAD", live?.unread, live?.last_message?.sender);

  // Open chat to clear unread
  await page.getByRole("button", { name: /Open chat/i }).first().click();
  await page.waitForTimeout(2000);
  const afterRead = await apiJson("GET", `/api/v1/threads/${threadId}/`, { token });
  if (
    !results(
      "h — farmer unread via admin + mark-read clears",
      Number(live?.unread) === 2 && Number(afterRead.data?.unread) === 0,
      `beforeOpen=${live?.unread} afterOpen=${afterRead.data?.unread}`,
    )
  )
    failed++;

  // Logout and confirm poll stops
  threadReqs.length = 0;
  await page.getByRole("button", { name: /Log out/i }).click();
  await page.waitForURL(/login/, { timeout: 30000 });
  await page.waitForTimeout(55000);
  const afterLogout = threadReqs.filter((r) => r.url.includes("/threads/"));
  if (!results("k — poll stops after logout", afterLogout.length === 0, `reqs=${afterLogout.length}`))
    failed++;
} catch (err) {
  console.error("SMOKE fatal", err);
  failed++;
}

await browser.close();

console.log(`\nSMOKE_DONE failed=${failed}`);
process.exit(failed ? 1 : 0);
