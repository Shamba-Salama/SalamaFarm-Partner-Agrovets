import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { l as usePortal, n as useAuth } from "./router-Cm66njxJ.mjs";
import { l as formatApiError, n as Card, o as Input, r as CardContent, s as Label, t as Button } from "./card-DsOLYs-m.mjs";
import { c as Sprout } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/onboarding-CONbtRqi.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function OnboardingPage() {
	const { profile } = usePortal();
	const { register, isAuthenticated, isBootstrapping } = useAuth();
	const navigate = useNavigate();
	const [submitting, setSubmitting] = (0, import_react.useState)(false);
	const [form, setForm] = (0, import_react.useState)({
		email: "",
		name: profile.name,
		town: profile.town,
		county: profile.county,
		till: profile.till,
		attendantPhone: profile.attendantPhone,
		password: ""
	});
	(0, import_react.useEffect)(() => {
		if (!isBootstrapping && isAuthenticated) navigate({ to: "/" });
	}, [
		isAuthenticated,
		isBootstrapping,
		navigate
	]);
	const set = (k) => (e) => setForm((f) => ({
		...f,
		[k]: e.target.value
	}));
	const valid = form.email.includes("@") && form.name.trim().length > 1 && form.town.trim().length > 1 && form.county.trim().length > 1 && form.till.trim().length > 3 && form.attendantPhone.trim().length > 8 && form.password.length >= 8;
	const onSubmit = async () => {
		if (!valid || submitting) return;
		setSubmitting(true);
		try {
			await register({
				email: form.email.trim(),
				password: form.password,
				phone: form.attendantPhone.trim(),
				store: {
					name: form.name.trim(),
					town: form.town.trim(),
					county: form.county.trim(),
					till: form.till.trim(),
					attendant_phone: form.attendantPhone.trim()
				}
			});
			toast.success("Welcome to SalamaFarm Partner Portal!", { description: "Start listing your inventory." });
			navigate({ to: "/inventory" });
		} catch (err) {
			toast.error(formatApiError(err, "Could not create account."));
		} finally {
			setSubmitting(false);
		}
	};
	if (isBootstrapping) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground",
		children: "Checking session…"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-background",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid min-h-screen max-w-6xl lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "hidden flex-col justify-between bg-sidebar p-10 lg:flex",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid h-10 w-10 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sprout, { className: "h-5 w-5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-bold text-sidebar-foreground",
							children: "SalamaFarm Partner Agrovets"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-3xl font-bold leading-tight text-sidebar-foreground",
						children: "Sell to thousands of farmers from your counter."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-sm text-sm text-sidebar-foreground/75",
						children: "No permits, no paperwork, no waiting. Fill one form and start listing stock today."
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "space-y-2 text-sm text-sidebar-foreground/75",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "✅ Instant access — no license upload required" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "✅ Live farmer chat with audible alerts" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "✅ Counter STK push and M-Pesa reconciliation" })
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex flex-col justify-center p-6 sm:p-10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-4 p-5 sm:p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-xl font-bold tracking-tight",
							children: "Register your agrovet"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "Tell us where farmers can find and pay you. Access is granted immediately."
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Email",
							value: form.email,
							onChange: set("email"),
							placeholder: "you@agrovet.co.ke",
							type: "email"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Store name",
							value: form.name,
							onChange: set("name"),
							placeholder: "Green Valley Agrovet"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Physical location / town",
								value: form.town,
								onChange: set("town"),
								placeholder: "Nakuru Town"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "County",
								value: form.county,
								onChange: set("county"),
								placeholder: "Nakuru"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "M-Pesa Till / Paybill number",
								value: form.till,
								onChange: set("till"),
								placeholder: "5203817"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Store attendant phone number",
								value: form.attendantPhone,
								onChange: set("attendantPhone"),
								placeholder: "0712345678"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Account password",
							value: form.password,
							onChange: set("password"),
							placeholder: "At least 8 characters",
							type: "password"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "w-full",
							disabled: !valid || submitting,
							onClick: () => void onSubmit(),
							children: submitting ? "Creating account…" : "Create store account"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-center text-xs text-muted-foreground",
							children: [
								"Already registered?",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/login",
									className: "font-medium text-primary underline-offset-4 hover:underline",
									children: "Sign in"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-center text-xs text-muted-foreground",
							children: "No business permit or agrochemical license upload needed."
						})
					]
				}) })
			})]
		})
	});
}
function Field({ label, value, onChange, placeholder, type }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			value,
			onChange,
			placeholder,
			type
		})]
	});
}
//#endregion
export { OnboardingPage as component };
