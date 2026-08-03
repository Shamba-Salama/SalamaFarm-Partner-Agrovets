import { VAT_RATE, formatKES, type CustomerOrder, type StoreProfile } from "./portal-store";

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ordersToCsv(orders: CustomerOrder[], store: StoreProfile) {
  const head = [
    "date",
    "time",
    "mpesa_code",
    "customer",
    "phone",
    "channel",
    "items",
    "gross_kes",
    "vat_16_kes",
    "net_kes",
    "till",
    "store",
  ];
  const lines = orders.map((o) => {
    const vat = Math.round(o.amount - o.amount / (1 + VAT_RATE));
    return [
      o.date,
      o.time,
      o.mpesaCode,
      o.customer,
      o.phone,
      o.channel === "in-app" ? "In-App" : "Offline SMS",
      o.items.map((i) => `${i.qty}x ${i.name}`).join(" | "),
      o.amount,
      vat,
      o.amount - vat,
      store.till,
      store.name,
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(",");
  });
  return [head.join(","), ...lines].join("\n");
}

export function printReceipt(order: CustomerOrder, store: StoreProfile) {
  const vat = Math.round(order.amount - order.amount / (1 + VAT_RATE));
  const subtotal = order.amount - vat;
  const rows = order.items
    .map(
      (i) =>
        `<tr><td>${i.name}</td><td class="r">${i.qty}</td><td class="r">${formatKES(
          i.price,
        )}</td><td class="r">${formatKES(i.price * i.qty)}</td></tr>`,
    )
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"/>
<title>Receipt ${order.mpesaCode}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:ui-sans-serif,system-ui,Arial,sans-serif;color:#0f172a;margin:0;padding:32px}
  .wrap{max-width:620px;margin:0 auto;border:1px solid #e2e8f0;border-radius:14px;padding:28px}
  h1{margin:0;font-size:20px;color:#1E5631}
  .muted{color:#64748b;font-size:12px}
  table{width:100%;border-collapse:collapse;margin-top:18px;font-size:13px}
  th,td{padding:8px 6px;border-bottom:1px solid #e2e8f0;text-align:left}
  th{background:#f1f5f9;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
  .r{text-align:right}
  .totals{margin-top:14px;margin-left:auto;width:260px;font-size:13px}
  .totals div{display:flex;justify-content:space-between;padding:5px 0}
  .grand{font-weight:700;font-size:16px;border-top:2px solid #1E5631;color:#1E5631}
  .stamp{margin-top:22px;display:inline-block;border:2px dashed #1E5631;color:#1E5631;
    padding:8px 14px;border-radius:10px;font-weight:700;font-size:12px;letter-spacing:.06em}
</style></head><body><div class="wrap">
  <h1>${store.name}</h1>
  <p class="muted">${store.town}, ${store.county} County · M-Pesa Till ${store.till}</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
  <p class="muted">Receipt / Order Summary</p>
  <p style="margin:4px 0"><strong>M-Pesa Code:</strong> ${order.mpesaCode}<br/>
  <strong>Customer:</strong> ${order.customer} (+${order.phone})<br/>
  <strong>Date:</strong> ${order.date} ${order.time} · <strong>Type:</strong> ${order.orderType}</p>
  <table><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Unit</th><th class="r">Total</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <div class="totals">
    <div><span>Subtotal (excl. VAT)</span><span>${formatKES(subtotal)}</span></div>
    <div><span>VAT 16%</span><span>${formatKES(vat)}</span></div>
    <div class="grand"><span>Total paid</span><span>${formatKES(order.amount)}</span></div>
  </div>
  <div class="stamp">✔ VERIFIED BY SALAMAFARM</div>
  <p class="muted" style="margin-top:16px">Thank you for shopping with a SalamaFarm partner agrovet.</p>
</div>
<script>window.onload=function(){window.print()}</script>
</body></html>`;

  const w = window.open("", "_blank", "width=760,height=900");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  return true;
}
