import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { l as usePortal } from "./router-Cm66njxJ.mjs";
import { c as cn, n as Card, r as CardContent, t as Button } from "./card-DsOLYs-m.mjs";
import { y as MessageSquareText } from "../_libs/lucide-react.mjs";
import { l as PortalLayout, n as ChannelBadge } from "./PortalLayout-BnksNs0v.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/messages-CWXN5rTe.js
var import_jsx_runtime = require_jsx_runtime();
function MessagesPage() {
	const { threads, threadsLoading, threadsReady, openChat, unreadMessages } = usePortal();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortalLayout, {
		title: "Farmer Messages",
		subtitle: `${threads.length} conversations · ${unreadMessages} unread`,
		children: threadsLoading && !threadsReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "py-16 text-center text-sm text-muted-foreground",
			children: "Loading conversations…"
		}) : threads.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "py-16 text-center text-sm text-muted-foreground",
			children: "No conversations yet"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3 md:grid-cols-2 xl:grid-cols-3",
			children: threads.map((t) => {
				const last = t.lastMessage;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: cn(t.unread > 0 && "ring-2 ring-primary/40"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "space-y-2 p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate font-semibold",
										children: t.farmer
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "truncate text-xs text-muted-foreground",
										children: [
											"+",
											t.phone,
											" · ",
											t.topic
										]
									})]
								}), t.unread > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground",
									children: t.unread
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChannelBadge, { channel: t.channel }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "line-clamp-2 text-sm text-muted-foreground",
								children: last ? `${last.from === "store" ? "You: " : ""}${last.text}` : "No messages yet"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								className: "w-full",
								onClick: () => {
									openChat(t.id);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquareText, { className: "mr-1.5 h-4 w-4" }), " Open chat"]
							})
						]
					})
				}, t.id);
			})
		})
	});
}
//#endregion
export { MessagesPage as component };
