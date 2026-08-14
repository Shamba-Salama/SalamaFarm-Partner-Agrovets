import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { c as stockStatus, d as prepareWeeklySalesChartRows, l as usePortal, s as formatKES } from "./router-Cm66njxJ.mjs";
import { a as CardTitle, i as CardHeader, n as Card, r as CardContent, t as Button } from "./card-DsOLYs-m.mjs";
import { _ as Package, a as TrendingUp, b as MapPin, i as TriangleAlert, m as Receipt, n as Users, v as MessagesSquare } from "../_libs/lucide-react.mjs";
import { l as PortalLayout, n as ChannelBadge, t as Badge } from "./PortalLayout-BnksNs0v.mjs";
import { a as Line, c as ResponsiveContainer, i as XAxis, l as Tooltip, n as LineChart, o as CartesianGrid, r as YAxis, s as Bar, t as BarChart, u as Legend } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DJEAZgiI.js
var import_jsx_runtime = require_jsx_runtime();
function DashboardPage() {
	const { orders, products, threads, unreadMessages, profile, weeklySales, weeklySalesLoading, weeklySalesReady, appVisits, appVisitsLoading, appVisitsReady } = usePortal();
	const revenue = orders.reduce((s, o) => s + o.amount, 0);
	const pending = orders.filter((o) => o.status === "Pending").length;
	const alerts = products.filter((p) => stockStatus(p) !== "In Stock");
	const appVisitsHeadline = appVisitsReady ? String(appVisits?.arrivedThisWeek ?? 0) : appVisitsLoading ? "…" : "—";
	const appVisitsNote = appVisitsReady ? `${appVisits?.arrivedCount ?? 0} arrived total · ${appVisits?.startedCount ?? 0} in progress` : "Customer Get Directions arrivals";
	const chartRows = prepareWeeklySalesChartRows(weeklySales);
	const weekCount = chartRows.length;
	const trend = chartRows.map((w) => ({
		week: w.week,
		Revenue: w.Fertilizer + w.Seeds + w["Vet Supplies"] + w.Pesticides
	}));
	const storeLabel = profile.name || "Your store";
	const subtitle = weekCount > 0 ? `${storeLabel} · last ${weekCount} week${weekCount === 1 ? "" : "s"}` : `${storeLabel} · weekly sales`;
	const chartsBusy = weeklySalesLoading && !weeklySalesReady;
	const chartsEmpty = weeklySalesReady && chartRows.length === 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PortalLayout, {
		title: "Dashboard Overview",
		subtitle,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						icon: TrendingUp,
						label: "Total revenue",
						value: formatKES(revenue),
						note: "All recorded M-Pesa sales"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						icon: Package,
						label: "Active products",
						value: String(products.filter((p) => p.active).length),
						note: `${alerts.length} need attention`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						icon: MessagesSquare,
						label: "Unread messages",
						value: String(unreadMessages),
						note: `${threads.length} farmer conversations`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						icon: Users,
						label: "Pending follow-ups",
						value: String(pending),
						note: "Customers awaiting a check-in"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						icon: MapPin,
						label: "App Visits",
						value: appVisitsHeadline,
						note: appVisitsNote
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-4 xl:grid-cols-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "xl:col-span-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
						className: "pb-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-base",
							children: "Weekly sales by category"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "h-72 pl-0",
						children: chartsBusy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "grid h-full place-items-center text-sm text-muted-foreground",
							children: "Loading weekly sales…"
						}) : chartsEmpty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "grid h-full place-items-center text-sm text-muted-foreground",
							children: "No sales recorded yet"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
							width: "100%",
							height: "100%",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
								data: chartRows,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
										strokeDasharray: "3 3",
										stroke: "hsl(var(--border))",
										opacity: .4
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
										dataKey: "week",
										fontSize: 12,
										tickLine: false,
										axisLine: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
										fontSize: 11,
										tickLine: false,
										axisLine: false,
										width: 54
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { formatter: (v) => formatKES(v) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, { wrapperStyle: { fontSize: 11 } }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
										dataKey: "Fertilizer",
										stackId: "a",
										fill: "var(--color-primary)",
										radius: [
											0,
											0,
											0,
											0
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
										dataKey: "Seeds",
										stackId: "a",
										fill: "var(--color-success)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
										dataKey: "Vet Supplies",
										stackId: "a",
										fill: "var(--color-info)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
										dataKey: "Pesticides",
										stackId: "a",
										fill: "var(--color-warning)",
										radius: [
											4,
											4,
											0,
											0
										]
									})
								]
							})
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
					className: "pb-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
						className: "text-base",
						children: "Revenue trend"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "h-72 pl-0",
					children: chartsBusy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "grid h-full place-items-center text-sm text-muted-foreground",
						children: "Loading…"
					}) : chartsEmpty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "grid h-full place-items-center text-sm text-muted-foreground",
						children: "No sales recorded yet"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
							data: trend,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
									strokeDasharray: "3 3",
									stroke: "hsl(var(--border))",
									opacity: .4
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
									dataKey: "week",
									fontSize: 12,
									tickLine: false,
									axisLine: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									fontSize: 11,
									tickLine: false,
									axisLine: false,
									width: 54
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { formatter: (v) => formatKES(v) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									type: "monotone",
									dataKey: "Revenue",
									stroke: "var(--color-primary)",
									strokeWidth: 2.5,
									dot: false
								})
							]
						})
					})
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
					className: "pb-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
						className: "flex items-center gap-2 text-base",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-4 w-4 text-warning" }), " Stock & expiry alerts"]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-2",
					children: [
						alerts.slice(0, 5).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 rounded-lg bg-muted/50 p-2.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-card text-lg",
									children: p.image
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block truncate text-sm font-medium",
										children: p.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "block text-xs text-muted-foreground",
										children: [
											p.stock,
											" in stock · ",
											p.expiry ? `expires ${p.expiry}` : "no expiry date"
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "secondary",
									className: "shrink-0",
									children: stockStatus(p)
								})
							]
						}, p.id)),
						!alerts.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "py-6 text-center text-sm text-muted-foreground",
							children: "All stock is healthy."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							variant: "outline",
							size: "sm",
							className: "w-full",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/inventory",
								children: "Manage inventory"
							})
						})
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
					className: "pb-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
						className: "flex items-center gap-2 text-base",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { className: "h-4 w-4 text-primary" }), " Latest orders"]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-2",
					children: [orders.slice(0, 5).map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 p-2.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-sm font-medium",
									children: o.customer
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "block truncate text-xs text-muted-foreground",
									children: [
										o.product,
										" · ",
										o.mpesaCode
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChannelBadge, { channel: o.channel }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-semibold tabular-nums",
								children: formatKES(o.amount)
							})
						]
					}, o.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "outline",
						size: "sm",
						className: "w-full",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/orders",
							children: "Open sales & orders log"
						})
					})]
				})] })]
			})
		]
	});
}
function Metric({ icon: Icon, label, value, note }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-medium text-muted-foreground",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 truncate text-2xl font-bold tabular-nums tracking-tight",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-0.5 truncate text-xs text-muted-foreground",
				children: note
			})
		]
	}) });
}
//#endregion
export { DashboardPage as component };
