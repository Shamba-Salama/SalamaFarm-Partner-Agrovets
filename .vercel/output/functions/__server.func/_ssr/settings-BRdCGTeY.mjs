import { i as __toESM } from "../_runtime.mjs";
import { t as ApiError } from "./auth-storage-CRdHlSbd.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { l as usePortal } from "./router-Cm66njxJ.mjs";
import { a as CardTitle, i as CardHeader, l as formatApiError, n as Card, o as Input, r as CardContent, s as Label, t as Button } from "./card-DsOLYs-m.mjs";
import { l as PortalLayout } from "./PortalLayout-BnksNs0v.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-BRdCGTeY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SettingsPage() {
	const { profile, updateStore } = usePortal();
	const [submitting, setSubmitting] = (0, import_react.useState)(false);
	const [locating, setLocating] = (0, import_react.useState)(false);
	const [form, setForm] = (0, import_react.useState)({
		name: profile.name,
		town: profile.town,
		county: profile.county,
		till: profile.till,
		attendantPhone: profile.attendantPhone,
		latitude: profile.latitude != null ? String(profile.latitude) : "",
		longitude: profile.longitude != null ? String(profile.longitude) : ""
	});
	(0, import_react.useEffect)(() => {
		setForm({
			name: profile.name,
			town: profile.town,
			county: profile.county,
			till: profile.till,
			attendantPhone: profile.attendantPhone,
			latitude: profile.latitude != null ? String(profile.latitude) : "",
			longitude: profile.longitude != null ? String(profile.longitude) : ""
		});
	}, [
		profile.name,
		profile.town,
		profile.county,
		profile.till,
		profile.attendantPhone,
		profile.latitude,
		profile.longitude
	]);
	const set = (k) => (e) => setForm((f) => ({
		...f,
		[k]: e.target.value
	}));
	const parseCoord = (raw) => {
		const trimmed = raw.trim();
		if (!trimmed) return null;
		const n = Number(trimmed);
		if (!Number.isFinite(n)) return "invalid";
		return n;
	};
	const latParsed = parseCoord(form.latitude);
	const lngParsed = parseCoord(form.longitude);
	const valid = form.name.trim().length > 1 && form.town.trim().length > 1 && form.county.trim().length > 1 && form.till.trim().length > 3 && form.attendantPhone.trim().length > 8 && latParsed !== "invalid" && lngParsed !== "invalid" && (latParsed === null && lngParsed === null || typeof latParsed === "number" && typeof lngParsed === "number");
	const onUseCurrentLocation = () => {
		if (!navigator.geolocation) {
			toast.error("Geolocation is not available in this browser.");
			return;
		}
		setLocating(true);
		navigator.geolocation.getCurrentPosition((pos) => {
			setForm((f) => ({
				...f,
				latitude: pos.coords.latitude.toFixed(6),
				longitude: pos.coords.longitude.toFixed(6)
			}));
			setLocating(false);
			toast.success("Location filled — save to apply.");
		}, (err) => {
			setLocating(false);
			toast.error(err.message || "Could not read your current location.");
		}, {
			enableHighAccuracy: true,
			timeout: 15e3,
			maximumAge: 0
		});
	};
	const onSave = async () => {
		if (!valid || submitting) return;
		if (latParsed === "invalid" || lngParsed === "invalid") return;
		setSubmitting(true);
		try {
			await updateStore({
				name: form.name.trim(),
				town: form.town.trim(),
				county: form.county.trim(),
				till: form.till.trim(),
				attendantPhone: form.attendantPhone.trim(),
				latitude: latParsed,
				longitude: lngParsed
			});
			toast.success("Store profile saved");
		} catch (err) {
			toast.error(err instanceof ApiError ? formatApiError(err) : "Could not save store profile.");
		} finally {
			setSubmitting(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortalLayout, {
		title: "Store Settings",
		subtitle: "Update how farmers find and pay your agrovet",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-2xl space-y-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
				className: "pb-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-base",
					children: "Store profile"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Store name",
						value: form.name,
						onChange: set("name")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Town / location",
							value: form.town,
							onChange: set("town")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "County",
							value: form.county,
							onChange: set("county")
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "M-Pesa Till / Paybill",
							value: form.till,
							onChange: set("till")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Attendant phone",
							value: form.attendantPhone,
							onChange: set("attendantPhone")
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3 rounded-lg border border-border bg-muted/30 p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium text-foreground",
								children: "Map pin (GPS)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: "Used for customer Get Directions and arrival tracking. Leave blank to clear."
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Latitude",
									value: form.latitude,
									onChange: set("latitude"),
									placeholder: "-1.286389",
									inputMode: "decimal"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Longitude",
									value: form.longitude,
									onChange: set("longitude"),
									placeholder: "36.817223",
									inputMode: "decimal"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "secondary",
								disabled: locating,
								onClick: onUseCurrentLocation,
								children: locating ? "Locating…" : "Use My Current Location"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground",
						children: [
							"Verification status:",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-foreground",
								children: profile.onboarded ? "Verified Merchant ✅" : "Pending Verification ⏳"
							}),
							". License upload is not wired to the API yet (see below)."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						disabled: !valid || submitting,
						onClick: () => void onSave(),
						children: submitting ? "Saving…" : "Save changes"
					})
				]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
				className: "pb-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-base",
					children: "License / permit upload"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "text-foreground",
							children: "Known gap:"
						}), " there is no backend endpoint for business permit or agrochemical license upload yet (README Step 2). This control is disabled and does not upload or mark you verified."]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "license-file",
							children: "Upload permit / license"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "license-file",
							type: "file",
							disabled: true,
							accept: ".pdf,image/*"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						disabled: true,
						variant: "secondary",
						children: "Upload (unavailable)"
					})
				]
			})] })]
		})
	});
}
function Field({ label, value, onChange, placeholder, inputMode }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			value,
			onChange,
			placeholder,
			inputMode
		})]
	});
}
//#endregion
export { SettingsPage as component };
