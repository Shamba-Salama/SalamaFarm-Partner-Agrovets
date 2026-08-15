import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, ImagePlus, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { PortalLayout } from "@/components/portal/PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CATEGORIES,
  daysUntil,
  formatKES,
  stockStatus,
  usePortal,
  type Category,
  type Product,
} from "@/lib/portal-store";
import type { ProductWriteBody } from "@/lib/catalog-api";
import { ApiError } from "@/lib/api-client";
import { formatApiError } from "@/lib/format-api-error";
import { CsvImportDialog } from "@/components/portal/CsvImportDialog";
import { ProductGalleryPicker } from "@/components/portal/ProductGalleryPicker";
import { galleryItemToFile, type GalleryItem } from "@/lib/product-gallery";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Product Inventory | SalamaFarm Partner Agrovets" },
      {
        name: "description",
        content:
          "Add, edit and track agrovet stock levels, expiry dates and prices in KES from one inventory table.",
      },
      { property: "og:title", content: "Product Inventory | SalamaFarm Partner Agrovets" },
      {
        property: "og:description",
        content: "Full inventory management for fertilizer, seeds, vet supplies and pesticides.",
      },
    ],
  }),
  component: InventoryPage,
});

const emptyDraft = (): ProductWriteBody => ({
  name: "",
  category: "Fertilizer",
  description: "",
  price: 0,
  stock: 0,
  expiry: null,
  image: "🧺",
  active: true,
  imageFile: null,
  existingImageUrl: null,
});

type DrawerState =
  | { mode: "create"; draft: ProductWriteBody }
  | { mode: "edit"; id: string; draft: ProductWriteBody };

function productToDraft(p: Product): ProductWriteBody {
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
    existingImageUrl: p.imageUrl ?? null,
  };
}

function InventoryPage() {
  const {
    products,
    productsLoading,
    createProductEntry,
    updateProductEntry,
    removeProduct,
    toggleProduct,
  } = usePortal();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | Category>("all");
  const [sortAsc, setSortAsc] = useState(true);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => {
    const list = products.filter(
      (p) =>
        (category === "all" || p.category === category) &&
        p.name.toLowerCase().includes(query.toLowerCase()),
    );
    return list.sort((a, b) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );
  }, [products, query, category, sortAsc]);

  const filtersActive = query.trim().length > 0 || category !== "all";

  const onToggle = async (p: Product) => {
    if (busyId) return;
    setBusyId(p.id);
    try {
      await toggleProduct(p.id);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? formatApiError(err) : "Could not update product status.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (p: Product) => {
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

  const onSaveDrawer = async (draft: ProductWriteBody) => {
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

  return (
    <PortalLayout
      title="Product Inventory"
      subtitle={`${products.length} products in your catalogue`}
      actions={
        <>
          <Button size="sm" variant="outline" onClick={() => setCsvOpen(true)}>
            <Upload className="mr-1.5 h-4 w-4" /> Import CSV
          </Button>
          <Button size="sm" onClick={() => setDrawer({ mode: "create", draft: emptyDraft() })}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Product
          </Button>
        </>
      }
    >
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
                className="pl-9"
              />
            </div>
            <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setSortAsc((s) => !s)}>
              <ArrowUpDown className="mr-1.5 h-4 w-4" /> Name {sortAsc ? "A–Z" : "Z–A"}
            </Button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Item</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsLoading && products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      Loading products…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 && products.length === 0 && !filtersActive ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      No products yet — add your first product or import a CSV
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      No products match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((p) => {
                    const status = stockStatus(p);
                    const danger =
                      status === "Low Stock" || status === "Expired" || status === "Clearance";
                    const days = daysUntil(p.expiry);
                    const rowBusy = busyId === p.id;
                    return (
                      <TableRow key={p.id} className={cn(!p.active && "opacity-55")}>
                        <TableCell>
                          <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-lg bg-muted text-lg">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              p.image
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="min-w-[180px] font-medium">{p.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{p.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{p.stock}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatKES(p.price)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {p.expiry ? (
                            <>
                              {p.expiry}
                              {days !== null ? (
                                <span className="block text-[11px]">{days} days left</span>
                              ) : null}
                            </>
                          ) : (
                            "No expiry date"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "border-transparent",
                              status === "In Stock" && "bg-success text-success-foreground",
                              status === "Clearance" && "bg-warning text-warning-foreground",
                              danger &&
                                status !== "Clearance" &&
                                "bg-destructive text-destructive-foreground",
                            )}
                          >
                            {status === "Clearance" ? "Clearance Candidate" : status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1.5">
                            <Switch
                              checked={p.active}
                              disabled={rowBusy}
                              onCheckedChange={() => void onToggle(p)}
                              aria-label="Toggle active"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={rowBusy}
                              onClick={() =>
                                setDrawer({ mode: "edit", id: p.id, draft: productToDraft(p) })
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={rowBusy}
                              onClick={() => void onDelete(p)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CsvImportDialog open={csvOpen} onOpenChange={setCsvOpen} />

      <ProductDrawer
        state={drawer}
        saving={saving}
        onClose={() => setDrawer(null)}
        onSave={(draft) => void onSaveDrawer(draft)}
      />
    </PortalLayout>
  );
}

function ProductDrawer({
  state,
  saving,
  onClose,
  onSave,
}: {
  state: DrawerState | null;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: ProductWriteBody) => void;
}) {
  const [draft, setDraft] = useState<ProductWriteBody | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pickingId, setPickingId] = useState<string | null>(null);

  useEffect(() => {
    setDraft(state?.draft ?? null);
    setPickingId(null);
  }, [state]);

  useEffect(() => {
    if (!draft?.imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(draft.imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [draft?.imageFile]);

  const shownImage = previewUrl || draft?.existingImageUrl || null;

  const onPickImage = (file: File | null) => {
    if (!draft) return;
    if (!file) {
      setDraft({ ...draft, imageFile: null });
      return;
    }
    const okType = ["image/jpeg", "image/jpg", "image/png"].includes(file.type);
    if (!okType) {
      toast.error("Please choose a JPG or PNG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5 MB or smaller.");
      return;
    }
    setDraft({ ...draft, imageFile: file });
  };

  const onPickGallery = async (item: GalleryItem) => {
    if (!draft || pickingId) return;
    setPickingId(item.id);
    try {
      const file = await galleryItemToFile(item);
      const fillEmpty = !draft.name.trim();
      setDraft({
        ...draft,
        imageFile: file,
        name: fillEmpty ? item.name : draft.name,
        category: fillEmpty ? item.category : draft.category,
        description: fillEmpty || !draft.description.trim() ? item.description : draft.description,
      });
      toast.success(`Using ${item.name} photo`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not apply gallery photo.");
    } finally {
      setPickingId(null);
    }
  };

  return (
    <Sheet open={!!state} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {draft && state && (
          <>
            <SheetHeader>
              <SheetTitle>{state.mode === "edit" ? "Edit product" : "Add new product"}</SheetTitle>
              <SheetDescription>
                Details shown to farmers browsing the SalamaFarm mobile app.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label>Product title</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. YaraMila Cereal 50kg"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={draft.category}
                  onValueChange={(v) => setDraft({ ...draft, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Chemical composition / usage instructions</Label>
                <Textarea
                  rows={4}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Active ingredients, dosage, safety notes…"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Price (KES)</Label>
                  <Input
                    type="number"
                    value={draft.price}
                    onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Stock quantity</Label>
                  <Input
                    type="number"
                    value={draft.stock}
                    onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Expiry date</Label>
                <Input
                  type="date"
                  value={draft.expiry ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, expiry: e.target.value ? e.target.value : null })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Product image</Label>
                <label className="flex cursor-pointer flex-col gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm transition-colors hover:bg-muted">
                  {shownImage ? (
                    <img
                      src={shownImage}
                      alt="Product preview"
                      className="mx-auto h-32 w-full max-w-xs rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <ImagePlus className="h-5 w-5 shrink-0" />
                      <span className="min-w-0">Upload product photo (JPG / PNG)</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {draft.imageFile
                      ? `Selected: ${draft.imageFile.name}`
                      : shownImage
                        ? "Tap to replace with a new JPG or PNG (max 5 MB), or pick from the Salama gallery below."
                        : "Upload your own photo, or choose one from the Salama gallery. Farmers see this in the mobile marketplace."}
                  </p>
                </label>
                <ProductGalleryPicker onPick={(item) => void onPickGallery(item)} pickingId={pickingId} />
                {(draft.imageFile || draft.existingImageUrl) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-fit px-0 text-muted-foreground"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        imageFile: null,
                        // Keep existing server image unless a new file was chosen;
                        // clearing only removes the pending local file selection.
                      })
                    }
                    disabled={!draft.imageFile}
                  >
                    {draft.imageFile ? "Clear selected photo" : null}
                  </Button>
                )}
              </div>
            </div>

            <SheetFooter className="mt-6 flex-row gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => onSave(draft)}
                disabled={!draft.name.trim() || saving}
              >
                {saving ? "Saving…" : "Save product"}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
