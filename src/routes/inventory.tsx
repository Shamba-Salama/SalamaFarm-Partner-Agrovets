import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpDown, ImagePlus, Pencil, Plus, Search, Trash2 } from "lucide-react";
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

const emptyProduct = (): Product => ({
  id: crypto.randomUUID(),
  name: "",
  category: "Fertilizer",
  description: "",
  price: 0,
  stock: 0,
  expiry: "2027-01-01",
  image: "🧺",
  active: true,
});

function InventoryPage() {
  const { products, saveProduct, deleteProduct, toggleProduct } = usePortal();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | Category>("all");
  const [sortAsc, setSortAsc] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);

  const rows = useMemo(() => {
    const list = products.filter(
      (p) =>
        (category === "all" || p.category === category) &&
        p.name.toLowerCase().includes(query.toLowerCase()),
    );
    return list.sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
  }, [products, query, category, sortAsc]);

  return (
    <PortalLayout
      title="Product Inventory"
      subtitle={`${products.length} products in your catalogue`}
      actions={
        <Button size="sm" onClick={() => setEditing(emptyProduct())}>
          <Plus className="mr-1.5 h-4 w-4" /> Add New Product
        </Button>
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
                {rows.map((p) => {
                  const status = stockStatus(p);
                  const danger = status === "Low Stock" || status === "Expired" || status === "Clearance";
                  return (
                    <TableRow key={p.id} className={cn(!p.active && "opacity-55")}>
                      <TableCell>
                        <span className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-lg">
                          {p.image}
                        </span>
                      </TableCell>
                      <TableCell className="min-w-[180px] font-medium">{p.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{p.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{p.stock}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatKES(p.price)}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {p.expiry}
                        <span className="block text-[11px]">{daysUntil(p.expiry)} days left</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "border-transparent",
                            status === "In Stock" && "bg-success text-success-foreground",
                            status === "Clearance" && "bg-warning text-warning-foreground",
                            danger && status !== "Clearance" && "bg-destructive text-destructive-foreground",
                          )}
                        >
                          {status === "Clearance" ? "Clearance Candidate" : status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1.5">
                          <Switch
                            checked={p.active}
                            onCheckedChange={() => toggleProduct(p.id)}
                            aria-label="Toggle active"
                          />
                          <Button size="icon" variant="ghost" onClick={() => setEditing(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              deleteProduct(p.id);
                              toast.success(`${p.name} removed from inventory`);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      No products match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ProductDrawer
        product={editing}
        onClose={() => setEditing(null)}
        onSave={(p) => {
          saveProduct(p);
          setEditing(null);
          toast.success(`${p.name} saved`);
        }}
      />
    </PortalLayout>
  );
}

function ProductDrawer({
  product,
  onClose,
  onSave,
}: {
  product: Product | null;
  onClose: () => void;
  onSave: (p: Product) => void;
}) {
  const [draft, setDraft] = useState<Product | null>(product);
  if (product && (!draft || draft.id !== product.id)) setDraft(product);

  return (
    <Sheet open={!!product} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {draft && (
          <>
            <SheetHeader>
              <SheetTitle>{draft.name ? "Edit product" : "Add new product"}</SheetTitle>
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
                  onValueChange={(v) => setDraft({ ...draft, category: v as Category })}
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
                  value={draft.expiry}
                  onChange={(e) => setDraft({ ...draft, expiry: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Product image</Label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground transition-colors hover:bg-muted">
                  <ImagePlus className="h-5 w-5 shrink-0" />
                  <span className="min-w-0 truncate">Upload product photo (JPG / PNG)</span>
                  <input type="file" accept="image/*" className="hidden" />
                </label>
              </div>
            </div>

            <SheetFooter className="mt-6 flex-row gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={() => onSave(draft)} disabled={!draft.name}>
                Save product
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
