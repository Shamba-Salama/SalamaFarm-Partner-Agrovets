import { i as __toESM } from "../_runtime.mjs";
import { t as ApiError } from "./auth-storage-CRdHlSbd.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { d as useRouterState, v as Link, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as VAT_RATE, l as usePortal, n as useAuth, s as formatKES, u as normalizeKenyaMsisdn } from "./router-Cm66njxJ.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { a as DialogOverlay$1, i as DialogDescription$1, n as DialogClose, o as DialogPortal$1, r as DialogContent$1, s as DialogTitle$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { c as cn, l as formatApiError, o as Input, s as Label, t as Button } from "./card-DsOLYs-m.mjs";
import { A as ChevronUp, E as FileDown, M as Check, N as Bell, P as BellOff, S as LayoutDashboard, _ as Package, c as Sprout, d as Send, j as ChevronDown, l as Smartphone, m as Receipt, n as Users, s as Store, t as X, v as MessagesSquare, x as LogOut, y as MessageSquareText } from "../_libs/lucide-react.mjs";
import { n as SwitchThumb, t as Switch$1 } from "../_libs/radix-ui__react-switch.mjs";
import { a as SelectItemIndicator, c as SelectPortal, d as SelectSeparator$1, f as SelectTrigger$1, i as SelectItem$1, l as SelectScrollDownButton$1, m as SelectViewport, n as SelectContent$1, o as SelectItemText, p as SelectValue$1, r as SelectIcon, s as SelectLabel$1, t as Select$1, u as SelectScrollUpButton$1 } from "../_libs/@radix-ui/react-select+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/PortalLayout-BnksNs0v.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Switch = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch$1, {
	className: cn("peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input", className),
	...props,
	ref,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, { className: cn("pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0") })
}));
Switch.displayName = Switch$1.displayName;
var badgeVariants = cva("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
	variants: { variant: {
		default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
		secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
		destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
		outline: "text-foreground"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
var Sheet = Dialog$1;
var SheetPortal = DialogPortal$1;
var SheetOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}));
SheetOverlay.displayName = DialogOverlay$1.displayName;
var sheetVariants = cva("fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out", {
	variants: { side: {
		top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
		bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
		left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
		right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
	} },
	defaultVariants: { side: "right" }
});
var SheetContent = import_react.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
	ref,
	className: cn(sheetVariants({ side }), className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	}), children]
})] }));
SheetContent.displayName = DialogContent$1.displayName;
var SheetHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
SheetHeader.displayName = "SheetHeader";
var SheetFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
SheetFooter.displayName = "SheetFooter";
var SheetTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
	ref,
	className: cn("text-lg font-semibold text-foreground", className),
	...props
}));
SheetTitle.displayName = DialogTitle$1.displayName;
var SheetDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
SheetDescription.displayName = DialogDescription$1.displayName;
function ChannelBadge({ channel }) {
	return channel === "in-app" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
		className: "border-transparent bg-success text-success-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquareText, { className: "mr-1 h-3 w-3" }), " In-App Delivery"]
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
		className: "border-transparent bg-info text-info-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { className: "mr-1 h-3 w-3" }), " Offline SMS Delivery"]
	});
}
function ChatDrawer() {
	const { threads, openThreadId, openChat, sendMessage } = usePortal();
	const thread = threads.find((t) => t.id === openThreadId) ?? null;
	const [text, setText] = (0, import_react.useState)("");
	const [sending, setSending] = (0, import_react.useState)(false);
	const endRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		endRef.current?.scrollIntoView({ block: "end" });
	}, [
		thread?.messages.length,
		openThreadId,
		thread?.messagesLoaded
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open: !!thread,
		onOpenChange: (o) => {
			if (!o) openChat(null);
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
			className: "flex w-full flex-col p-0 sm:max-w-md",
			children: thread && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetHeader, {
					className: "border-b border-border p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetTitle, {
						className: "flex flex-wrap items-center gap-2",
						children: [thread.farmer, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChannelBadge, { channel: thread.channel })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetDescription, { children: [
						"+",
						thread.phone,
						" · ",
						thread.topic
					] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4",
					children: !thread.messagesLoaded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "py-10 text-center text-sm text-muted-foreground",
						children: "Loading conversation…"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [thread.messages.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: cn("flex", m.from === "store" ? "justify-end" : "justify-start"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm", m.from === "store" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-card text-card-foreground"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "whitespace-pre-wrap break-words",
								children: m.text
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-1 block text-[10px] opacity-70",
								children: m.time
							})]
						})
					}, m.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: endRef })] })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "flex items-center gap-2 border-t border-border p-3",
					onSubmit: (e) => {
						e.preventDefault();
						if (!text.trim() || sending || !thread.messagesLoaded) return;
						(async () => {
							setSending(true);
							try {
								await sendMessage(thread.id, text.trim());
								setText("");
							} catch (err) {
								toast.error(err instanceof ApiError ? formatApiError(err) : "Could not send message.");
							} finally {
								setSending(false);
							}
						})();
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: text,
						onChange: (e) => setText(e.target.value),
						disabled: sending || !thread.messagesLoaded,
						placeholder: thread.channel === "in-app" ? "Reply in app…" : "Record reply (SMS gateway not connected)…"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						size: "icon",
						disabled: !text.trim() || sending || !thread.messagesLoaded,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-4 w-4" })
					})]
				})
			] })
		})
	});
}
var Dialog = Dialog$1;
var DialogPortal = DialogPortal$1;
var DialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
	ref,
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}));
DialogOverlay.displayName = DialogOverlay$1.displayName;
var DialogContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	})]
})] }));
DialogContent.displayName = DialogContent$1.displayName;
var DialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
	...props
});
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
DialogFooter.displayName = "DialogFooter";
var DialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
	ref,
	className: cn("text-lg font-semibold leading-none tracking-tight", className),
	...props
}));
DialogTitle.displayName = DialogTitle$1.displayName;
var DialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
DialogDescription.displayName = DialogDescription$1.displayName;
var Select = Select$1;
var SelectValue = SelectValue$1;
var SelectTrigger = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectTrigger$1, {
	ref,
	className: cn("flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectIcon, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4 opacity-50" })
	})]
}));
SelectTrigger.displayName = SelectTrigger$1.displayName;
var SelectScrollUpButton = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollUpButton$1, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "h-4 w-4" })
}));
SelectScrollUpButton.displayName = SelectScrollUpButton$1.displayName;
var SelectScrollDownButton = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollDownButton$1, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4" })
}));
SelectScrollDownButton.displayName = SelectScrollDownButton$1.displayName;
var SelectContent = import_react.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent$1, {
	ref,
	className: cn("relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-select-content-transform-origin)", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className),
	position,
	...props,
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollUpButton, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectViewport, {
			className: cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"),
			children
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollDownButton, {})
	]
}) }));
SelectContent.displayName = SelectContent$1.displayName;
var SelectLabel = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectLabel$1, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", className),
	...props
}));
SelectLabel.displayName = SelectLabel$1.displayName;
var SelectItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem$1, {
	ref,
	className: cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemText, { children })]
}));
SelectItem.displayName = SelectItem$1.displayName;
var SelectSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectSeparator$1, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
SelectSeparator.displayName = SelectSeparator$1.displayName;
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
function StkPushDialog({ open, onOpenChange }) {
	const { products, profile, createCounterOrder, chargeCounterOrder, createStoreSubaccount } = usePortal();
	const [step, setStep] = (0, import_react.useState)("compose");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [customer, setCustomer] = (0, import_react.useState)("");
	const [productId, setProductId] = (0, import_react.useState)("");
	const [submitting, setSubmitting] = (0, import_react.useState)(false);
	const [creatingSubaccount, setCreatingSubaccount] = (0, import_react.useState)(false);
	const [createdOrder, setCreatedOrder] = (0, import_react.useState)(null);
	const [awaitingText, setAwaitingText] = (0, import_react.useState)(null);
	const [phoneError, setPhoneError] = (0, import_react.useState)(null);
	const selected = products.find((p) => p.id === productId);
	const amount = selected ? selected.price : 0;
	const normalizedPhone = normalizeKenyaMsisdn(phone);
	const hasSubaccount = Boolean(profile.paystackSubaccountCode?.trim());
	const composeValid = Boolean(selected) && amount > 0 && Boolean(normalizedPhone);
	const reset = () => {
		setStep("compose");
		setPhone("");
		setCustomer("");
		setProductId("");
		setSubmitting(false);
		setCreatingSubaccount(false);
		setCreatedOrder(null);
		setAwaitingText(null);
		setPhoneError(null);
	};
	const onPhoneBlur = () => {
		if (!phone.trim()) {
			setPhoneError(null);
			return;
		}
		setPhoneError(normalizeKenyaMsisdn(phone) ? null : "Use 07XXXXXXXX or +2547XXXXXXXX (10 digits after 0, or 12 with 254).");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (v) => {
			onOpenChange(v);
			if (!v) reset();
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-h-[90vh] overflow-y-auto sm:max-w-lg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Counter M-Pesa STK Push" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: step === "compose" ? "Create a counter order, then send a Paystack M-Pesa prompt to the farmer." : "Confirm the phone and send the STK charge. Payment is confirmed by webhook — this only starts the prompt." })] }),
				step === "compose" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Farmer phone number" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: phone,
									onChange: (e) => {
										setPhone(e.target.value);
										setPhoneError(null);
									},
									onBlur: onPhoneBlur,
									placeholder: "0712345678",
									inputMode: "tel"
								}),
								phoneError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-destructive",
									children: phoneError
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Farmer name (optional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: customer,
								onChange: (e) => setCustomer(e.target.value),
								placeholder: "e.g. Wanjiku Mwangi"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Product from inventory" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: productId || void 0,
									onValueChange: setProductId,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select a product" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "custom",
										disabled: true,
										children: "Custom amount… (unavailable — needs a catalog product)"
									}), products.filter((p) => p.active).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
										value: p.id,
										children: [
											p.name,
											" — ",
											formatKES(p.price)
										]
									}, p.id))] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "Custom amounts have no backend representation (`items` require a real product_id). Pick a product from inventory."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl bg-muted p-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: "Amount to request"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xl font-bold tabular-nums",
								children: formatKES(amount || 0)
							})]
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						createdOrder && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl bg-muted p-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-medium",
								children: ["Order #", createdOrder.id]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-muted-foreground",
								children: [
									createdOrder.product,
									" · ",
									formatKES(createdOrder.amount)
								]
							})]
						}),
						!hasSubaccount && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: "Paystack subaccount required"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-muted-foreground",
									children: "This store has no Paystack subaccount yet. Create one before charging — otherwise the request will fail."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									size: "sm",
									disabled: creatingSubaccount,
									onClick: () => {
										(async () => {
											setCreatingSubaccount(true);
											try {
												const res = await createStoreSubaccount();
												toast.success(res.created ? "Paystack subaccount created" : "Using existing Paystack subaccount", { description: res.subaccountCode });
											} catch (err) {
												toast.error(err instanceof ApiError ? formatApiError(err) : "Could not create subaccount.");
											} finally {
												setCreatingSubaccount(false);
											}
										})();
									},
									children: creatingSubaccount ? "Creating…" : "Create Paystack subaccount"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Charge phone" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: phone,
									onChange: (e) => {
										setPhone(e.target.value);
										setPhoneError(null);
									},
									onBlur: onPhoneBlur,
									placeholder: "0712345678",
									inputMode: "tel"
								}),
								phoneError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-destructive",
									children: phoneError
								})
							]
						}),
						awaitingText && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-info/30 bg-info/10 p-3 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: "Awaiting confirmation"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-muted-foreground",
									children: awaitingText
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-xs text-muted-foreground",
									children: "The order is not marked paid until Paystack confirms. Use “Refresh payment status” on the orders page after the farmer completes the prompt."
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, {
					className: "flex-col gap-2 sm:flex-col",
					children: step === "compose" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "w-full",
						disabled: !composeValid || submitting,
						onClick: () => {
							(async () => {
								if (!selected) return;
								const e164 = normalizeKenyaMsisdn(phone);
								if (!e164) {
									setPhoneError("Use 07XXXXXXXX or +2547XXXXXXXX (10 digits after 0, or 12 with 254).");
									return;
								}
								setSubmitting(true);
								try {
									const { order, channel } = await createCounterOrder({
										phone: e164,
										productId: selected.id,
										customer
									});
									setCreatedOrder(order);
									setStep("charge");
									toast.success(`Order #${order.id} created`, { description: channel === "offline-sms" ? "Number not seen before — tagged Offline/SMS for follow-ups." : "Phone already known — follow-ups tagged in-app." });
								} catch (err) {
									toast.error(err instanceof ApiError ? formatApiError(err) : "Could not create order.");
								} finally {
									setSubmitting(false);
								}
							})();
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { className: "mr-1.5 h-4 w-4" }),
							" ",
							submitting ? "Creating order…" : "Create counter order"
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "w-full",
						disabled: !createdOrder || !hasSubaccount || !normalizedPhone || submitting || Boolean(awaitingText),
						onClick: () => {
							(async () => {
								if (!createdOrder) return;
								const e164 = normalizeKenyaMsisdn(phone);
								if (!e164) {
									setPhoneError("Use 07XXXXXXXX or +2547XXXXXXXX (10 digits after 0, or 12 with 254).");
									return;
								}
								setSubmitting(true);
								try {
									const res = await chargeCounterOrder({
										orderId: createdOrder.id,
										phone: e164
									});
									const text = res.display_text?.trim() || `Charge started (${res.status ?? "pending"}). Reference ${res.reference}.`;
									setAwaitingText(text);
									toast.message("STK prompt sent — awaiting confirmation", { description: text });
								} catch (err) {
									chargeFailureToast(err);
								} finally {
									setSubmitting(false);
								}
							})();
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { className: "mr-1.5 h-4 w-4" }),
							" ",
							submitting ? "Sending STK…" : awaitingText ? "Awaiting confirmation" : "Send STK charge"
						]
					}), awaitingText && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						className: "w-full",
						onClick: () => {
							onOpenChange(false);
							reset();
						},
						children: "Done"
					})] })
				})
			]
		})
	});
}
function downloadFile(filename, content, mime) {
	const blob = new Blob([content], { type: mime });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
function ordersToCsv(orders, store) {
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
		"store"
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
			store.name
		].map((c) => `"${String(c).replace(/"/g, "\"\"")}"`).join(",");
	});
	return [head.join(","), ...lines].join("\n");
}
function printReceipt(order, store) {
	const vat = Math.round(order.amount - order.amount / (1 + VAT_RATE));
	const subtotal = order.amount - vat;
	const rows = order.items.map((i) => `<tr><td>${i.name}</td><td class="r">${i.qty}</td><td class="r">${formatKES(i.price)}</td><td class="r">${formatKES(i.price * i.qty)}</td></tr>`).join("");
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
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;
	const w = window.open("", "_blank", "width=760,height=900");
	if (!w) return false;
	w.document.write(html);
	w.document.close();
	return true;
}
var TODAY = "2026-07-30";
function shift(days) {
	const d = /* @__PURE__ */ new Date("2026-07-30T00:00:00Z");
	d.setUTCDate(d.getUTCDate() - days);
	return d.toISOString().slice(0, 10);
}
function ExportSalesDialog({ open, onOpenChange }) {
	const { orders, profile } = usePortal();
	const [preset, setPreset] = (0, import_react.useState)("month");
	const [from, setFrom] = (0, import_react.useState)(shift(30));
	const [to, setTo] = (0, import_react.useState)(TODAY);
	const range = (0, import_react.useMemo)(() => {
		if (preset === "week") return {
			from: shift(7),
			to: TODAY
		};
		if (preset === "month") return {
			from: shift(30),
			to: TODAY
		};
		return {
			from,
			to
		};
	}, [
		preset,
		from,
		to
	]);
	const rows = orders.filter((o) => o.date >= range.from && o.date <= range.to);
	const gross = rows.reduce((s, o) => s + o.amount, 0);
	const vat = Math.round(gross - gross / (1 + VAT_RATE));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-h-[90vh] overflow-y-auto sm:max-w-lg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Export sales report for tax / accounting" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Produces an eTIMS-friendly CSV you can upload straight into your accounting software." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-3 gap-2",
					children: [
						["week", "This week"],
						["month", "This month"],
						["custom", "Custom range"]
					].map(([k, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setPreset(k),
						className: cn("rounded-lg border px-3 py-2 text-xs font-medium transition-colors", preset === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted"),
						children: label
					}, k))
				}),
				preset === "custom" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "From" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							value: from,
							onChange: (e) => setFrom(e.target.value)
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "To" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							value: to,
							onChange: (e) => setTo(e.target.value)
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-3 gap-2 rounded-xl bg-muted p-3 text-center text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Orders"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-bold tabular-nums",
							children: rows.length
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Gross"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-bold tabular-nums",
							children: formatKES(gross)
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "VAT 16%"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-bold tabular-nums",
							children: formatKES(vat)
						})] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "w-full",
					disabled: !rows.length,
					onClick: () => {
						downloadFile(`salamafarm-sales-${range.from}-to-${range.to}.csv`, ordersToCsv(rows, profile), "text/csv");
						onOpenChange(false);
						toast.success(`Exported ${rows.length} sales records`);
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileDown, { className: "mr-1.5 h-4 w-4" }),
						" Download report (",
						rows.length,
						")"
					]
				}) })
			]
		})
	});
}
var nav = [
	{
		to: "/",
		label: "Overview",
		icon: LayoutDashboard,
		badge: "none"
	},
	{
		to: "/inventory",
		label: "Inventory",
		icon: Package,
		badge: "none"
	},
	{
		to: "/messages",
		label: "Messages",
		icon: MessagesSquare,
		badge: "messages"
	},
	{
		to: "/orders",
		label: "Orders",
		icon: Receipt,
		badge: "orders"
	},
	{
		to: "/customers",
		label: "Follow-Ups",
		icon: Users,
		badge: "none"
	},
	{
		to: "/settings",
		label: "Settings",
		icon: Store,
		badge: "none"
	}
];
function PortalLayout({ title, subtitle, actions, children }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const navigate = useNavigate();
	const { isAuthenticated, isBootstrapping, logout, vendor } = useAuth();
	const { profile, toggleStoreOpen, unreadMessages, newOrderCount, openChat, lastIncoming, soundOn, setSoundOn, enablePush } = usePortal();
	const [stkOpen, setStkOpen] = (0, import_react.useState)(false);
	const [exportOpen, setExportOpen] = (0, import_react.useState)(false);
	const [togglingOpen, setTogglingOpen] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!isBootstrapping && !isAuthenticated) navigate({ to: "/login" });
	}, [
		isAuthenticated,
		isBootstrapping,
		navigate
	]);
	(0, import_react.useEffect)(() => {
		enablePush();
	}, [enablePush]);
	(0, import_react.useEffect)(() => {
		if (!lastIncoming) return;
		const { thread, text } = lastIncoming;
		toast(`New inquiry from ${thread.farmer}`, {
			description: `${thread.topic} — ${text}`,
			action: {
				label: "Reply Now",
				onClick: () => openChat(thread.id)
			},
			duration: 12e3
		});
	}, [lastIncoming, openChat]);
	const badgeFor = (kind) => kind === "messages" ? unreadMessages : kind === "orders" ? newOrderCount : 0;
	const onToggleOpen = async () => {
		if (togglingOpen) return;
		setTogglingOpen(true);
		try {
			await toggleStoreOpen();
		} catch (err) {
			toast.error(err instanceof ApiError ? formatApiError(err) : "Could not update store status.");
		} finally {
			setTogglingOpen(false);
		}
	};
	if (isBootstrapping || !isAuthenticated) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground",
		children: isBootstrapping ? "Loading…" : "Redirecting to sign in…"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-sidebar px-3 py-5 lg:flex",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "mt-7 flex flex-1 flex-col gap-1",
						children: nav.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavItem, {
							to: item.to,
							label: item.label,
							icon: item.icon,
							count: badgeFor(item.badge),
							active: pathname === item.to
						}, item.to))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [
							vendor?.email ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate px-2 text-[11px] text-sidebar-foreground/70",
								children: vendor.email
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "ghost",
								size: "sm",
								className: "w-full justify-start gap-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
								onClick: () => logout(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-4 w-4" }), "Log out"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl bg-sidebar-accent/60 p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs font-semibold text-sidebar-foreground",
										children: "Alert sounds"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
										checked: soundOn,
										onCheckedChange: setSoundOn
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 flex items-center gap-1.5 text-[11px] text-sidebar-foreground/70",
									children: [soundOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-3 w-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellOff, { className: "h-3 w-3" }), "Chime + push on new farmer messages"]
								})]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lg:pl-60",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WelcomeBanner, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
						className: "sticky top-0 z-20 border-b border-border bg-card/85 px-4 py-3 backdrop-blur sm:px-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-[140px] flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "truncate text-lg font-bold tracking-tight text-foreground sm:text-xl",
									children: title
								}), subtitle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-xs text-muted-foreground sm:text-sm",
									children: subtitle
								}) : null]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										disabled: togglingOpen,
										onClick: () => void onToggleOpen(),
										className: cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors", profile.open ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/10 text-destructive", togglingOpen && "opacity-70"),
										children: ["Store Status: ", profile.open ? "Open 🟢" : "Closed 🔴"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										onClick: () => setStkOpen(true),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { className: "mr-1.5 h-4 w-4" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "hidden sm:inline",
												children: "Counter M-Pesa"
											}),
											" STK Push"
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										variant: "outline",
										onClick: () => setExportOpen(true),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileDown, { className: "mr-1.5 h-4 w-4" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "hidden md:inline",
												children: "Export Sales Report"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "md:hidden",
												children: "Export"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "outline",
										className: "lg:hidden",
										onClick: () => logout(),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-4 w-4" })
									}),
									actions
								]
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
						className: "px-4 pb-28 pt-5 sm:px-6 lg:pb-10",
						children
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-border bg-card lg:hidden",
				children: nav.map(({ to, label, icon: Icon, badge }) => {
					const active = pathname === to;
					const count = badgeFor(badge);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to,
						className: cn("relative flex flex-col items-center gap-1 py-2 text-[10px] font-medium", active ? "text-primary" : "text-muted-foreground"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-5 w-5" }),
							count > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "absolute right-1/4 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground",
								children: count
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate px-0.5",
								children: label
							})
						]
					}, to);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatDrawer, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StkPushDialog, {
				open: stkOpen,
				onOpenChange: setStkOpen
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExportSalesDialog, {
				open: exportOpen,
				onOpenChange: setExportOpen
			})
		]
	});
}
function Brand() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/",
		className: "flex items-center gap-2 px-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sprout, { className: "h-5 w-5" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block truncate text-sm font-bold text-sidebar-foreground",
				children: "SalamaFarm"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block truncate text-[11px] text-sidebar-foreground/70",
				children: "Partner Agrovets"
			})]
		})]
	});
}
function NavItem({ to, label, icon: Icon, active, count }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		className: cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors", active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4 shrink-0" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "min-w-0 flex-1 truncate",
				children: label
			}),
			count > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground",
				children: count
			})
		]
	});
}
function WelcomeBanner() {
	const { profile } = usePortal();
	const verified = profile.onboarded;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-xs font-medium sm:px-6", verified ? "bg-success text-success-foreground" : "bg-amber-600 text-white"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sprout, { className: "h-4 w-4" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: verified ? "Verified Merchant ✅" : "Pending Verification ⏳" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "opacity-90",
				children: [
					profile.name || "Your store",
					profile.town || profile.county ? ` · ${[profile.town, profile.county].filter(Boolean).join(", ")}` : "",
					profile.till ? ` · Till ${profile.till}` : ""
				]
			})
		]
	});
}
//#endregion
export { printReceipt as C, downloadFile as S, SheetDescription as _, DialogDescription as a, SheetTitle as b, DialogTitle as c, SelectContent as d, SelectItem as f, SheetContent as g, Sheet as h, DialogContent as i, PortalLayout as l, SelectValue as m, ChannelBadge as n, DialogFooter as o, SelectTrigger as p, Dialog as r, DialogHeader as s, Badge as t, Select as u, SheetFooter as v, Switch as x, SheetHeader as y };
