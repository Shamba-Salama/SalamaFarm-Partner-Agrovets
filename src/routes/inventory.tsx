import { createFileRoute } from "@tanstack/react-router";
<<<<<<< HEAD
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
=======
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowUpDown,
  ImagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
>>>>>>> 4ad3290f16a1e6d8714e9a69c6e0b56ece5f8620
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
import { ImageUploader } from "@/components/portal/ImageUploader";
import { ProductGalleryPicker } from "@/components/portal/ProductGalleryPicker";
import { galleryItemToFile, type GalleryItem } from "@/lib/product-gallery";
import { uploadImage } from "@/lib/upload-image";
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
  imageUrl: null,
  imageUrlTouched: false,
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
    imageUrl: p.imageUrl ?? null,
    imageUrlTouched: false,
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
    publishProduct,
    unpublishProduct,
    archiveProduct,
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

  const onPublicationAction = async (p: Product, action: "publish" | "unpublish" | "archive") => {
    if (busyId) return;
    setBusyId(p.id);
    try {
      if (action === "publish") {
        await publishProduct(p.id);
        toast.success(`${p.name} submitted for admin review`);
      } else if (action === "unpublish") {
        await unpublishProduct(p.id);
        toast.success(`${p.name} moved to drafts`);
      } else {
        await archiveProduct(p.id);
        toast.success(`${p.name} archived`);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? formatApiError(err) : `Could not ${action} product.`);
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
          <Button size="sm" variant="outline" className="shrink-0" onClick={() => setCsvOpen(true)}>
            <Upload className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Import CSV</span>
          </Button>
          <Button
            size="sm"
            className="shrink-0"
            onClick={() => setDrawer({ mode: "create", draft: emptyDraft() })}
          >
            <Plus className="h-4 w-4 sm:mr-1.5" />
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">Add Product</span>
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
                  <TableHead>Stock status</TableHead>
                  <TableHead>Publication</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsLoading && products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                      Loading products…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 && products.length === 0 && !filtersActive ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                      No products yet — add your first product or import a CSV
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                      No products match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((p) => {
                    const stockState = stockStatus(p);
                    const danger =
                      stockState === "Low Stock" ||
                      stockState === "Expired" ||
                      stockState === "Clearance";
                    const days = daysUntil(p.expiry);
                    const rowBusy = busyId === p.id;
                    return (
                      <TableRow key={p.id} className={cn(!p.active && "opacity-55")}>
                        <TableCell>
                          <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-lg bg-muted text-lg">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
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
                              stockState === "In Stock" && "bg-success text-success-foreground",
                              stockState === "Clearance" && "bg-warning text-warning-foreground",
                              danger &&
                                stockState !== "Clearance" &&
                                "bg-destructive text-destructive-foreground",
                            )}
                          >
                            {stockState === "Clearance" ? "Clearance Candidate" : stockState}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge
                              variant={
                                p.status === "published"
                                  ? "default"
                                  : p.status === "pending"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {p.status === "pending"
                                ? "Pending review"
                                : p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                            </Badge>
                            {p.status === "draft" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={rowBusy}
                                onClick={() => void onPublicationAction(p, "publish")}
                              >
                                Submit for review
                              </Button>
                            )}
                            {(p.status === "published" || p.status === "pending") && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={rowBusy}
                                onClick={() => void onPublicationAction(p, "unpublish")}
                              >
                                {p.status === "pending" ? "Withdraw" : "Unpublish"}
                              </Button>
                            )}
                            {p.status !== "archived" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={rowBusy}
                                onClick={() => void onPublicationAction(p, "archive")}
                                aria-label={`Archive ${p.name}`}
                                title="Archive product"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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
  const [pickingId, setPickingId] = useState<string | null>(null);

  useEffect(() => {
    setDraft(state?.draft ?? null);
    setPickingId(null);
  }, [state]);

  const onPickGallery = useCallback(
    async (item: GalleryItem) => {
      if (!draft || saving || pickingId) return;
      setPickingId(item.id);
      try {
        const file = await galleryItemToFile(item);
        const url = await uploadImage(file);
        const fillEmpty = !draft.name.trim();
        setDraft({
          ...draft,
          imageUrl: url,
          imageUrlTouched: true,
          name: fillEmpty ? item.name : draft.name,
          category: fillEmpty ? item.category : draft.category,
          description:
            fillEmpty || !draft.description.trim() ? item.description : draft.description,
        });
        toast.success(`Using ${item.name} photo`);
      } catch (err) {
        toast.error(
          err instanceof ApiError
            ? formatApiError(err)
            : err instanceof Error
              ? err.message
              : "Could not use gallery photo.",
        );
      } finally {
        setPickingId(null);
      }
    },
    [draft, pickingId, saving],
  );
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
              <ImageUploader
                value={draft.imageUrl}
                onUploaded={(url) =>
                  setDraft({ ...draft, imageUrl: url, imageUrlTouched: true })
                }
                onRemoved={() => setDraft({ ...draft, imageUrl: null, imageUrlTouched: true })}
                disabled={saving}
              />
              <ProductGalleryPicker
                onPick={(item) => void onPickGallery(item)}
                pickingId={pickingId}
                disabled={saving}
              />
            </div>

            <SheetFooter className="mt-6 flex-row gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => onSave(draft)}
                disabled={!draft.name.trim() || saving || pickingId !== null}
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
