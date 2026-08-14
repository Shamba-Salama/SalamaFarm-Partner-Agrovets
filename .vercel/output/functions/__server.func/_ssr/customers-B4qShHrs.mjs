import { i as __toESM } from "../_runtime.mjs";
import { t as ApiError } from "./auth-storage-CRdHlSbd.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as FOLLOW_UP_TEMPLATES, l as usePortal } from "./router-Cm66njxJ.mjs";
import { l as formatApiError, n as Card, o as Input, r as CardContent, s as Label, t as Button } from "./card-DsOLYs-m.mjs";
import { d as Send, f as Search } from "../_libs/lucide-react.mjs";
import { a as DialogDescription, c as DialogTitle, d as SelectContent, f as SelectItem, i as DialogContent, l as PortalLayout, m as SelectValue, n as ChannelBadge, o as DialogFooter, p as SelectTrigger, r as Dialog, s as DialogHeader, u as Select } from "./PortalLayout-BnksNs0v.mjs";
import { t as Textarea } from "./textarea-DUlpVngg.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DEvFtfuy.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/customers-B4qShHrs.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var statuses = [
	"Pending",
	"Contacted",
	"Satisfied"
];
function CustomersPage() {
	const { orders, ordersLoading, setOrderStatus } = usePortal();
	const [query, setQuery] = (0, import_react.useState)("");
	const [target, setTarget] = (0, import_react.useState)(null);
	const [busyId, setBusyId] = (0, import_react.useState)(null);
	const rows = orders.filter((o) => o.customer.toLowerCase().includes(query.toLowerCase()) || o.phone.includes(query) || o.product.toLowerCase().includes(query.toLowerCase()));
	const filtersActive = query.trim().length > 0;
	const onStatusChange = async (id, status) => {
		if (busyId) return;
		setBusyId(id);
		try {
			await setOrderStatus(id, status);
		} catch (err) {
			toast.error(err instanceof ApiError ? formatApiError(err) : "Could not update follow-up status.");
		} finally {
			setBusyId(null);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PortalLayout, {
		title: "Customer Care & Follow-Ups",
		subtitle: `${orders.filter((o) => o.status === "Pending").length} customers awaiting a check-in`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
			className: "p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative max-w-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: query,
					onChange: (e) => setQuery(e.target.value),
					placeholder: "Search name, phone or product…",
					className: "pl-9"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Customer" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Item purchased" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Date" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Order type" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Platform channel" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Follow-up" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
						className: "text-right",
						children: "Action"
					})
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: ordersLoading && orders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					colSpan: 7,
					className: "py-10 text-center text-muted-foreground",
					children: "Loading customers…"
				}) }) : rows.length === 0 && orders.length === 0 && !filtersActive ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					colSpan: 7,
					className: "py-10 text-center text-muted-foreground",
					children: "No customers yet"
				}) }) : rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					colSpan: 7,
					className: "py-10 text-center text-muted-foreground",
					children: "No customers match your search."
				}) }) : rows.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
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
						children: o.product
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "whitespace-nowrap text-muted-foreground",
						children: o.date
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "whitespace-nowrap",
						children: o.orderType
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChannelBadge, { channel: o.channel }) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: o.status,
						disabled: busyId === o.id,
						onValueChange: (v) => void onStatusChange(o.id, v),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "w-[130px]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: statuses.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: s,
							children: s
						}, s)) })]
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-right",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							onClick: () => setTarget(o),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "mr-1.5 h-4 w-4" }), " Send Follow-Up"]
						})
					})
				] }, o.id)) })] })
			})]
		}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FollowUpDialog, {
			order: target,
			onClose: () => setTarget(null)
		})]
	});
}
function FollowUpDialog({ order, onClose }) {
	const { startThread, setOrderStatus } = usePortal();
	const [templateId, setTemplateId] = (0, import_react.useState)(FOLLOW_UP_TEMPLATES[0].id);
	const template = FOLLOW_UP_TEMPLATES.find((t) => t.id === templateId) ?? FOLLOW_UP_TEMPLATES[0];
	const [body, setBody] = (0, import_react.useState)("");
	const [sending, setSending] = (0, import_react.useState)(false);
	const text = body || (order ? template.body(order.customer, order.product) : "");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: !!order,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
			className: "max-h-[90vh] overflow-y-auto sm:max-w-lg",
			children: order && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: ["Send follow-up to ", order.customer] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: order.channel === "in-app" ? "Posts the message to this farmer’s in-app conversation and marks the order Contacted." : "Records the message on an offline-SMS thread (no SMS gateway — delivery is not transmitted) and marks the order Contacted." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChannelBadge, { channel: order.channel }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Template" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: templateId,
						onValueChange: (v) => {
							setTemplateId(v);
							setBody("");
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: FOLLOW_UP_TEMPLATES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: t.id,
							children: t.label
						}, t.id)) })]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Message" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						rows: 5,
						value: text,
						onChange: (e) => setBody(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "w-full",
					disabled: sending,
					onClick: () => {
						(async () => {
							setSending(true);
							try {
								await startThread({
									customerId: order.customerId,
									name: order.customer,
									phone: order.phone,
									channel: order.channel,
									topic: order.product,
									text
								});
								await setOrderStatus(order.id, "Contacted");
								onClose();
								setBody("");
								toast.success(order.channel === "in-app" ? "Follow-up posted to conversation · status Contacted" : "Follow-up recorded on offline-SMS thread · status Contacted (no SMS sent)");
							} catch (err) {
								toast.error(err instanceof ApiError ? formatApiError(err) : "Could not send follow-up.");
							} finally {
								setSending(false);
							}
						})();
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "mr-1.5 h-4 w-4" }),
						" ",
						sending ? "Sending…" : "Send follow-up"
					]
				}) })
			] })
		})
	});
}
//#endregion
export { CustomersPage as component };
