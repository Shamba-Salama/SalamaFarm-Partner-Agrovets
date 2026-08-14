import { i as __toESM } from "../_runtime.mjs";
import { t as ApiError } from "./auth-storage-CRdHlSbd.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { c as stockStatus, l as usePortal, o as daysUntil, r as CATEGORIES, s as formatKES } from "./router-Cm66njxJ.mjs";
import { c as cn, l as formatApiError, n as Card, o as Input, r as CardContent, s as Label, t as Button } from "./card-DsOLYs-m.mjs";
import { C as ImagePlus, D as Download, F as ArrowUpDown, O as CloudUpload, T as FileSpreadsheet, f as Search, g as Pencil, h as Plus, o as Trash2, r as Upload } from "../_libs/lucide-react.mjs";
import { S as downloadFile, _ as SheetDescription, a as DialogDescription, b as SheetTitle, c as DialogTitle, d as SelectContent, f as SelectItem, g as SheetContent, h as Sheet, i as DialogContent, l as PortalLayout, m as SelectValue, o as DialogFooter, p as SelectTrigger, r as Dialog, s as DialogHeader, t as Badge, u as Select, v as SheetFooter, x as Switch, y as SheetHeader } from "./PortalLayout-BnksNs0v.mjs";
import { t as Textarea } from "./textarea-DUlpVngg.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DEvFtfuy.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/inventory-UrxsK7kY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var HEADERS = [
	"product_name",
	"category",
	"price_kes",
	"stock_quantity",
	"unit_description",
	"expiry_date"
];
var TEMPLATE = [
	HEADERS.join(","),
	"YaraMila Cereal 50kg,Fertilizer,4850,24,50kg bag,2027-04-30",
	"Sukari F1 Tomato Seeds 10g,Seeds,2400,17,10g sachet,2027-01-18"
].join("\n");
/** Client-side CSV parse for the PREVIEW TABLE ONLY — server is authoritative on confirm. */
function parseCsvPreview(text) {
	const lines = text.trim().split(/\r?\n/).filter(Boolean);
	if (lines.length < 2) return [];
	const head = lines[0].split(",").map((h) => h.trim().toLowerCase());
	return lines.slice(1).map((line, idx) => {
		const cells = line.split(",").map((c) => c.trim());
		const get = (k) => cells[head.indexOf(k)] ?? "";
		const cat = get("category");
		const expiryRaw = get("expiry_date");
		return {
			id: `preview-${idx}`,
			name: get("product_name"),
			category: CATEGORIES.includes(cat) ? cat : "Fertilizer",
			description: get("unit_description"),
			price: Number(get("price_kes")) || 0,
			stock: Number(get("stock_quantity")) || 0,
			expiry: expiryRaw || null,
			image: "📦",
			active: true
		};
	});
}
function CsvImportDialog({ open, onOpenChange }) {
	const { importProductsCsvFile } = usePortal();
	const [rows, setRows] = (0, import_react.useState)([]);
	const [fileName, setFileName] = (0, import_react.useState)("");
	const [file, setFile] = (0, import_react.useState)(null);
	const [dragging, setDragging] = (0, import_react.useState)(false);
	const [importing, setImporting] = (0, import_react.useState)(false);
	const readFile = (f) => {
		setFile(f);
		setFileName(f.name);
		const reader = new FileReader();
		reader.onload = () => {
			const parsed = parseCsvPreview(String(reader.result)).filter((p) => p.name);
			setRows(parsed);
			if (!parsed.length) toast.error("No valid rows found — check your column headers");
		};
		reader.readAsText(f);
	};
	const close = () => {
		onOpenChange(false);
		setRows([]);
		setFileName("");
		setFile(null);
		setImporting(false);
	};
	const onConfirm = async () => {
		if (!file || importing) return;
		setImporting(true);
		try {
			const { created } = await importProductsCsvFile(file);
			toast.success(`${created} products added to inventory`);
			close();
		} catch (err) {
			const detail = err instanceof ApiError ? formatApiError(err) : "Import failed.";
			toast.error(`${detail} Nothing was imported — fix the CSV and try again.`);
		} finally {
			setImporting(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (v) => v ? onOpenChange(true) : close(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-h-[90vh] overflow-y-auto sm:max-w-3xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Import products via CSV" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: ["Bulk-load your whole shelf in one upload. Use the template so the columns match. Preview is client-side; the server validates and imports all rows or nothing.", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mt-2 block text-muted-foreground",
					children: "Photos are not included in CSV/Excel — after import, open each product and upload a JPG/PNG. Spreadsheets cannot reliably carry image files across machines."
				})] })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					size: "sm",
					className: "w-fit",
					onClick: () => downloadFile("salamafarm-inventory-template.csv", TEMPLATE, "text/csv"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-1.5 h-4 w-4" }), " Download CSV template"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					onDragOver: (e) => {
						e.preventDefault();
						setDragging(true);
					},
					onDragLeave: () => setDragging(false),
					onDrop: (e) => {
						e.preventDefault();
						setDragging(false);
						const f = e.dataTransfer.files?.[0];
						if (f) readFile(f);
					},
					className: cn("flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center transition-colors", dragging ? "border-primary bg-primary-soft" : "border-border bg-muted/40 hover:bg-muted"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudUpload, { className: "h-7 w-7 text-primary" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-medium",
							children: "Drag & drop your CSV here, or tap to browse"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs text-muted-foreground",
							children: ["Columns: ", HEADERS.join(", ")]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							accept: ".csv,text/csv",
							className: "hidden",
							onChange: (e) => {
								const f = e.target.files?.[0];
								if (f) readFile(f);
							}
						})
					]
				}),
				rows.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "h-4 w-4 text-primary" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "min-w-0 truncate font-medium",
								children: fileName
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
								variant: "secondary",
								children: [rows.length, " products parsed (preview)"]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "max-h-64 overflow-auto rounded-lg border border-border",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Product" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Category" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "text-right",
								children: "Price"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "text-right",
								children: "Stock"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Expiry" })
						] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "min-w-[160px] font-medium",
								children: r.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: r.category }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-right tabular-nums",
								children: formatKES(r.price)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-right tabular-nums",
								children: r.stock
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "whitespace-nowrap",
								children: r.expiry || "No expiry date"
							})
						] }, r.id)) })] })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "flex-row gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						className: "flex-1",
						onClick: close,
						disabled: importing,
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "flex-1",
						disabled: !file || !rows.length || importing,
						onClick: () => void onConfirm(),
						children: importing ? "Importing…" : "Confirm & Add Inventory"
					})]
				})
			]
		})
	});
}
var emptyDraft = () => ({
	name: "",
	category: "Fertilizer",
	description: "",
	price: 0,
	stock: 0,
	expiry: null,
	image: "🧺",
	active: true,
	imageFile: null,
	existingImageUrl: null
});
function productToDraft(p) {
	return {
		name: p.name,
		category: p.category,
		description: p.description,
		price: p.price,
		stock: p.stock,
		expiry: p.expiry,
		image: p.image,
		active: p.active,
		imageFile: null,
		existingImageUrl: p.imageUrl ?? null
	};
}
function InventoryPage() {
	const { products, productsLoading, createProductEntry, updateProductEntry, removeProduct, toggleProduct } = usePortal();
	const [query, setQuery] = (0, import_react.useState)("");
	const [category, setCategory] = (0, import_react.useState)("all");
	const [sortAsc, setSortAsc] = (0, import_react.useState)(true);
	const [drawer, setDrawer] = (0, import_react.useState)(null);
	const [csvOpen, setCsvOpen] = (0, import_react.useState)(false);
	const [busyId, setBusyId] = (0, import_react.useState)(null);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const rows = (0, import_react.useMemo)(() => {
		return products.filter((p) => (category === "all" || p.category === category) && p.name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
	}, [
		products,
		query,
		category,
		sortAsc
	]);
	const filtersActive = query.trim().length > 0 || category !== "all";
	const onToggle = async (p) => {
		if (busyId) return;
		setBusyId(p.id);
		try {
			await toggleProduct(p.id);
		} catch (err) {
			toast.error(err instanceof ApiError ? formatApiError(err) : "Could not update product status.");
		} finally {
			setBusyId(null);
		}
	};
	const onDelete = async (p) => {
		if (busyId) return;
		setBusyId(p.id);
		try {
			await removeProduct(p.id);
			toast.success(`${p.name} removed from inventory`);
		} catch (err) {
			toast.error(err instanceof ApiError ? formatApiError(err) : "Could not delete product.");
		} finally {
			setBusyId(null);
		}
	};
	const onSaveDrawer = async (draft) => {
		if (!drawer || saving) return;
		setSaving(true);
		try {
			if (drawer.mode === "create") {
				const created = await createProductEntry(draft);
				toast.success(`${created.name} saved`);
			} else {
				const updated = await updateProductEntry(drawer.id, draft);
				toast.success(`${updated.name} saved`);
			}
			setDrawer(null);
		} catch (err) {
			toast.error(err instanceof ApiError ? formatApiError(err) : "Could not save product.");
		} finally {
			setSaving(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PortalLayout, {
		title: "Product Inventory",
		subtitle: `${products.length} products in your catalogue`,
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			size: "sm",
			variant: "outline",
			onClick: () => setCsvOpen(true),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "mr-1.5 h-4 w-4" }), " Import CSV"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			size: "sm",
			onClick: () => setDrawer({
				mode: "create",
				draft: emptyDraft()
			}),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 h-4 w-4" }), " Add Product"]
		})] }),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: query,
								onChange: (e) => setQuery(e.target.value),
								placeholder: "Search products…",
								className: "pl-9"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: category,
							onValueChange: (v) => setCategory(v),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								className: "sm:w-48",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Category" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "all",
								children: "All categories"
							}), CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: c,
								children: c
							}, c))] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							onClick: () => setSortAsc((s) => !s),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpDown, { className: "mr-1.5 h-4 w-4" }),
								" Name ",
								sortAsc ? "A–Z" : "Z–A"
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
							className: "w-14",
							children: "Item"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Product" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Category" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
							className: "text-right",
							children: "Stock"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
							className: "text-right",
							children: "Price"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Expiry" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
							className: "text-right",
							children: "Actions"
						})
					] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: productsLoading && products.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						colSpan: 8,
						className: "py-10 text-center text-muted-foreground",
						children: "Loading products…"
					}) }) : rows.length === 0 && products.length === 0 && !filtersActive ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						colSpan: 8,
						className: "py-10 text-center text-muted-foreground",
						children: "No products yet — add your first product or import a CSV"
					}) }) : rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						colSpan: 8,
						className: "py-10 text-center text-muted-foreground",
						children: "No products match your filters."
					}) }) : rows.map((p) => {
						const status = stockStatus(p);
						const danger = status === "Low Stock" || status === "Expired" || status === "Clearance";
						const days = daysUntil(p.expiry);
						const rowBusy = busyId === p.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
							className: cn(!p.active && "opacity-55"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-10 w-10 place-items-center overflow-hidden rounded-lg bg-muted text-lg",
									children: p.imageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: p.imageUrl,
										alt: "",
										className: "h-full w-full object-cover"
									}) : p.image
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "min-w-[180px] font-medium",
									children: p.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "secondary",
									children: p.category
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-right tabular-nums",
									children: p.stock
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-right tabular-nums",
									children: formatKES(p.price)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "whitespace-nowrap text-sm text-muted-foreground",
									children: p.expiry ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [p.expiry, days !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "block text-[11px]",
										children: [days, " days left"]
									}) : null] }) : "No expiry date"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									className: cn("border-transparent", status === "In Stock" && "bg-success text-success-foreground", status === "Clearance" && "bg-warning text-warning-foreground", danger && status !== "Clearance" && "bg-destructive text-destructive-foreground"),
									children: status === "Clearance" ? "Clearance Candidate" : status
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-end gap-1.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											checked: p.active,
											disabled: rowBusy,
											onCheckedChange: () => void onToggle(p),
											"aria-label": "Toggle active"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "icon",
											variant: "ghost",
											disabled: rowBusy,
											onClick: () => setDrawer({
												mode: "edit",
												id: p.id,
												draft: productToDraft(p)
											}),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "icon",
											variant: "ghost",
											disabled: rowBusy,
											onClick: () => void onDelete(p),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4 text-destructive" })
										})
									]
								}) })
							]
						}, p.id);
					}) })] })
				})]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CsvImportDialog, {
				open: csvOpen,
				onOpenChange: setCsvOpen
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductDrawer, {
				state: drawer,
				saving,
				onClose: () => setDrawer(null),
				onSave: (draft) => void onSaveDrawer(draft)
			})
		]
	});
}
function ProductDrawer({ state, saving, onClose, onSave }) {
	const [draft, setDraft] = (0, import_react.useState)(null);
	const [previewUrl, setPreviewUrl] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		setDraft(state?.draft ?? null);
	}, [state]);
	(0, import_react.useEffect)(() => {
		if (!draft?.imageFile) {
			setPreviewUrl(null);
			return;
		}
		const url = URL.createObjectURL(draft.imageFile);
		setPreviewUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [draft?.imageFile]);
	const shownImage = previewUrl || draft?.existingImageUrl || null;
	const onPickImage = (file) => {
		if (!draft) return;
		if (!file) {
			setDraft({
				...draft,
				imageFile: null
			});
			return;
		}
		if (![
			"image/jpeg",
			"image/jpg",
			"image/png"
		].includes(file.type)) {
			toast.error("Please choose a JPG or PNG image.");
			return;
		}
		if (file.size > 5242880) {
			toast.error("Image must be 5 MB or smaller.");
			return;
		}
		setDraft({
			...draft,
			imageFile: file
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open: !!state,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
			className: "w-full overflow-y-auto sm:max-w-md",
			children: draft && state && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: state.mode === "edit" ? "Edit product" : "Add new product" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetDescription, { children: "Details shown to farmers browsing the SalamaFarm mobile app." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Product title" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: draft.name,
								onChange: (e) => setDraft({
									...draft,
									name: e.target.value
								}),
								placeholder: "e.g. YaraMila Cereal 50kg"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Category" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: draft.category,
								onValueChange: (v) => setDraft({
									...draft,
									category: v
								}),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: c,
									children: c
								}, c)) })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Chemical composition / usage instructions" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								rows: 4,
								value: draft.description,
								onChange: (e) => setDraft({
									...draft,
									description: e.target.value
								}),
								placeholder: "Active ingredients, dosage, safety notes…"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Price (KES)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									value: draft.price,
									onChange: (e) => setDraft({
										...draft,
										price: Number(e.target.value)
									})
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Stock quantity" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									value: draft.stock,
									onChange: (e) => setDraft({
										...draft,
										stock: Number(e.target.value)
									})
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Expiry date" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "date",
								value: draft.expiry ?? "",
								onChange: (e) => setDraft({
									...draft,
									expiry: e.target.value ? e.target.value : null
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Product image" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex cursor-pointer flex-col gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm transition-colors hover:bg-muted",
									children: [
										shownImage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: shownImage,
											alt: "Product preview",
											className: "mx-auto h-32 w-full max-w-xs rounded-lg object-cover"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3 text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "h-5 w-5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "min-w-0",
												children: "Upload product photo (JPG / PNG)"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "file",
											accept: "image/jpeg,image/png,image/jpg,.jpg,.jpeg,.png",
											className: "hidden",
											onChange: (e) => onPickImage(e.target.files?.[0] ?? null)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children: draft.imageFile ? `Selected: ${draft.imageFile.name}` : shownImage ? "Tap to replace with a new JPG or PNG (max 5 MB)." : "Optional. Farmers see this photo in the mobile marketplace."
										})
									]
								}),
								(draft.imageFile || draft.existingImageUrl) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "ghost",
									size: "sm",
									className: "w-fit px-0 text-muted-foreground",
									onClick: () => setDraft({
										...draft,
										imageFile: null
									}),
									disabled: !draft.imageFile,
									children: draft.imageFile ? "Clear selected photo" : null
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetFooter, {
					className: "mt-6 flex-row gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						className: "flex-1",
						onClick: onClose,
						disabled: saving,
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "flex-1",
						onClick: () => onSave(draft),
						disabled: !draft.name.trim() || saving,
						children: saving ? "Saving…" : "Save product"
					})]
				})
			] })
		})
	});
}
//#endregion
export { InventoryPage as component };
