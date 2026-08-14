import { i as __toESM } from "../_runtime.mjs";
import { t as ApiError } from "./auth-storage-CRdHlSbd.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as VAT_RATE, l as usePortal, s as formatKES, u as normalizeKenyaMsisdn } from "./router-Cm66njxJ.mjs";
import { c as cn, l as formatApiError, n as Card, o as Input, r as CardContent, t as Button } from "./card-DsOLYs-m.mjs";
import { f as Search, k as CircleCheck, l as Smartphone, p as RefreshCw, u as ShieldCheck, w as FileText } from "../_libs/lucide-react.mjs";
import { C as printReceipt, d as SelectContent, f as SelectItem, l as PortalLayout, m as SelectValue, n as ChannelBadge, p as SelectTrigger, t as Badge, u as Select } from "./PortalLayout-BnksNs0v.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DEvFtfuy.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/orders-C1y_N3YE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function formatPaidAt(iso) {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleString();
}
function chargeFailureToast(err) {
	if (!(err instanceof ApiError)) {
		toast.error("Could not initiate charge.");
		return;
	}
	const detail = formatApiError(err);
	if (err.status === 400) {
		toast.error("Charge could not start", { description: detail || "Check the phone number, subaccount, and order amount." });
		return;
	}
	if (err.status === 404) {
		toast.error("Order not found", { description: detail || "This order no longer exists for your store." });
		return;
	}
	if (err.status === 502) {
		toast.error("Paystack unreachable", { description: detail || "Paystack rejected or could not be reached. The charge was not initiated — try again later." });
		return;
	}
	toast.error(detail || "Could not initiate charge.");
}
function OrdersPage() {
	const { orders, ordersLoading, profile, setPickup, clearNewOrders, refreshOrders, chargeCounterOrder } = usePortal();
	const [verify, setVerify] = (0, import_react.useState)("");
	const [query, setQuery] = (0, import_react.useState)("");
	const [busyId, setBusyId] = (0, import_react.useState)(null);
	const [chargingId, setChargingId] = (0, import_react.useState)(null);
	const [refreshingPayments, setRefreshingPayments] = (0, import_react.useState)(false);
	const match = verify.trim() ? orders.find((o) => o.mpesaCode.toLowerCase() === verify.trim().toLowerCase()) : null;
	const rows = orders.filter((o) => o.customer.toLowerCase().includes(query.toLowerCase()) || o.mpesaCode.toLowerCase().includes(query.toLowerCase()) || o.product.toLowerCase().includes(query.toLowerCase()));
	const filtersActive = query.trim().length > 0;
	const onPickupChange = async (id, pickup) => {
		if (busyId) return;
		setBusyId(id);
		try {
			await setPickup(id, pickup);
			toast.success(`Pickup set to ${pickup}`);
		} catch (err) {
			toast.error(err instanceof ApiError ? formatApiError(err) : "Could not update pickup status.");
		} finally {
			setBusyId(null);
		}
	};
	const onMarkCollected = async (id) => {
		await onPickupChange(id, "Collected");
	};
	const onRefreshPayments = async () => {
		setRefreshingPayments(true);
		try {
			await refreshOrders();
			toast.success("Payment status refreshed");
		} catch (err) {
			toast.error(err instanceof ApiError ? formatApiError(err) : "Could not refresh orders.");
		} finally {
			setRefreshingPayments(false);
		}
	};
	const onCharge = async (o) => {
		if (o.paidAt || chargingId) return;
		const e164 = normalizeKenyaMsisdn(o.phone);
		if (!e164) {
			toast.error("Invalid phone on this order", { description: "Use 07XXXXXXXX or +2547XXXXXXXX before charging." });
			return;
		}
		if (!profile.paystackSubaccountCode?.trim()) {
			toast.error("Paystack subaccount required", { description: "Create a subaccount from the STK Push dialog before charging." });
			return;
		}
		setChargingId(o.id);
		try {
			const res = await chargeCounterOrder({
				orderId: o.id,
				phone: e164
			});
			const text = res.display_text?.trim() || `Charge started (${res.status ?? "pending"}). Reference ${res.reference}.`;
			toast.message("STK prompt sent — awaiting confirmation", { description: text });
		} catch (err) {
			chargeFailureToast(err);
		} finally {
			setChargingId(null);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PortalLayout, {
		title: "Sales, Orders & M-Pesa Log",
		subtitle: `${orders.length} recorded transactions`,
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				variant: "outline",
				disabled: refreshingPayments,
				onClick: () => void onRefreshPayments(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: cn("mr-1.5 h-4 w-4", refreshingPayments && "animate-spin") }), "Refresh payment status"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "ghost",
				onClick: clearNewOrders,
				children: "Mark orders seen"
			})]
		}),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
			className: "p-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-[220px] flex-1 space-y-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-xs font-semibold text-muted-foreground",
						children: "Verify M-Pesa confirmation code before releasing goods"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: verify,
							onChange: (e) => setVerify(e.target.value.toUpperCase()),
							placeholder: "e.g. SGJ9PL44BV",
							className: "pl-9 font-mono uppercase"
						})]
					})]
				}), verify.trim() && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: cn("min-w-[240px] flex-1 rounded-xl p-3 text-sm", match ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive"),
					children: match ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold",
							children: "✅ Valid payment found"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-foreground",
							children: [
								match.customer,
								" · ",
								formatKES(match.amount),
								" · ",
								match.product
							]
						}),
						match.pickup !== "Collected" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							className: "mt-2",
							disabled: busyId === match.id,
							onClick: () => void onMarkCollected(match.id),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mr-1.5 h-4 w-4" }), " Mark goods released"]
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-semibold",
						children: "⚠️ No payment matches this code — do not release goods."
					})
				})]
			})
		}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
			className: "mt-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative max-w-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: query,
						onChange: (e) => setQuery(e.target.value),
						placeholder: "Search code, customer or item…",
						className: "pl-9"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "M-Pesa code" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Customer" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Items" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Channel" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
							className: "text-right",
							children: "Total (incl. VAT)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Payment" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Timestamp" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Pickup" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
							className: "text-right",
							children: "Actions"
						})
					] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: ordersLoading && orders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						colSpan: 9,
						className: "py-10 text-center text-muted-foreground",
						children: "Loading orders…"
					}) }) : rows.length === 0 && orders.length === 0 && !filtersActive ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						colSpan: 9,
						className: "py-10 text-center text-muted-foreground",
						children: "No orders yet"
					}) }) : rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						colSpan: 9,
						className: "py-10 text-center text-muted-foreground",
						children: "No transactions match your search."
					}) }) : rows.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "font-mono text-xs",
							children: o.mpesaCode || "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
							className: "min-w-[150px]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block font-medium",
								children: o.customer
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "block text-xs text-muted-foreground",
								children: ["+", o.phone]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "min-w-[170px]",
							children: o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChannelBadge, { channel: o.channel }) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
							className: "text-right tabular-nums",
							children: [formatKES(o.amount), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "block text-[11px] text-muted-foreground",
								children: ["VAT ", formatKES(Math.round(o.amount - o.amount / (1 + VAT_RATE)))]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "min-w-[140px]",
							children: o.paidAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "secondary",
								children: "Paid"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-1 block text-[11px] text-muted-foreground",
								children: formatPaidAt(o.paidAt)
							})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								children: "Awaiting payment"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
							className: "whitespace-nowrap text-sm text-muted-foreground",
							children: [
								o.date,
								" ",
								o.time
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: o.pickup,
							disabled: busyId === o.id,
							onValueChange: (v) => void onPickupChange(o.id, v),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								className: "w-[160px]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: [
								"Unmatched",
								"Awaiting Pickup",
								"Collected"
							].map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: p,
								children: p
							}, p)) })]
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "text-right",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap justify-end gap-2",
								children: [o.paidAt === null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "secondary",
									disabled: chargingId !== null,
									onClick: () => void onCharge(o),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { className: "mr-1.5 h-4 w-4" }), chargingId === o.id ? "Sending…" : "Charge"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "outline",
									onClick: () => {
										if (!printReceipt(o, profile)) toast.error("Allow pop-ups to download the receipt");
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "mr-1.5 h-4 w-4" }), " Receipt"]
								})]
							})
						})
					] }, o.id)) })] })
				})]
			})
		})]
	});
}
//#endregion
export { OrdersPage as component };
