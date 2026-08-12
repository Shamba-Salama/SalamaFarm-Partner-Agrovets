import { useState } from "react";
import { Download, FileSpreadsheet, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CATEGORIES, formatKES, usePortal, type Category, type Product } from "@/lib/portal-store";
import { ApiError } from "@/lib/api-client";
import { formatApiError } from "@/lib/format-api-error";
import { downloadFile } from "@/lib/export";
import { cn } from "@/lib/utils";

const HEADERS = [
  "product_name",
  "category",
  "price_kes",
  "stock_quantity",
  "unit_description",
  "expiry_date",
];

const TEMPLATE = [
  HEADERS.join(","),
  "YaraMila Cereal 50kg,Fertilizer,4850,24,50kg bag,2027-04-30",
  "Sukari F1 Tomato Seeds 10g,Seeds,2400,17,10g sachet,2027-01-18",
].join("\n");

/** Client-side CSV parse for the PREVIEW TABLE ONLY — server is authoritative on confirm. */
function parseCsvPreview(text: string): Product[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const head = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line, idx) => {
    const cells = line.split(",").map((c) => c.trim());
    const get = (k: string) => cells[head.indexOf(k)] ?? "";
    const cat = get("category") as Category;
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
      active: true,
    } satisfies Product;
  });
}

export function CsvImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { importProductsCsvFile } = usePortal();
  const [rows, setRows] = useState<Product[]>([]);
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);

  const readFile = (f: File) => {
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

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import products via CSV</DialogTitle>
          <DialogDescription>
            Bulk-load your whole shelf in one upload. Use the template so the columns match. Preview
            is client-side; the server validates and imports all rows or nothing.
            <span className="mt-2 block text-muted-foreground">
              Photos are not included in CSV/Excel — after import, open each product and upload a
              JPG/PNG. Spreadsheets cannot reliably carry image files across machines.
            </span>
          </DialogDescription>
        </DialogHeader>

        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => downloadFile("salamafarm-inventory-template.csv", TEMPLATE, "text/csv")}
        >
          <Download className="mr-1.5 h-4 w-4" /> Download CSV template
        </Button>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) readFile(f);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center transition-colors",
            dragging
              ? "border-primary bg-primary-soft"
              : "border-border bg-muted/40 hover:bg-muted",
          )}
        >
          <UploadCloud className="h-7 w-7 text-primary" />
          <span className="text-sm font-medium">Drag & drop your CSV here, or tap to browse</span>
          <span className="text-xs text-muted-foreground">Columns: {HEADERS.join(", ")}</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) readFile(f);
            }}
          />
        </label>

        {rows.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <span className="min-w-0 truncate font-medium">{fileName}</span>
              <Badge variant="secondary">{rows.length} products parsed (preview)</Badge>
            </div>
            <div className="max-h-64 overflow-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Expiry</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="min-w-[160px] font-medium">{r.name}</TableCell>
                      <TableCell>{r.category}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatKES(r.price)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.stock}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {r.expiry || "No expiry date"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={close} disabled={importing}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={!file || !rows.length || importing}
            onClick={() => void onConfirm()}
          >
            {importing ? "Importing…" : "Confirm & Add Inventory"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
