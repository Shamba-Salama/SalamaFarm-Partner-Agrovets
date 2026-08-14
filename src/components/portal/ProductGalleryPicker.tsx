import { useMemo, useState, type ReactNode } from "react";
import { Images } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  filterGallery,
  galleryImageSrc,
  PRODUCT_GALLERY,
  type GalleryItem,
} from "@/lib/product-gallery";
import { CATEGORIES, type Category } from "@/lib/portal-store";
import { cn } from "@/lib/utils";

export function ProductGalleryPicker({
  onPick,
  pickingId,
}: {
  onPick: (item: GalleryItem) => void;
  pickingId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");

  const items = useMemo(() => filterGallery(PRODUCT_GALLERY, query, category), [query, category]);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setOpen((v) => !v)}
      >
        <Images className="mr-1.5 h-4 w-4" />
        {open ? "Hide Salama gallery" : "Choose from Salama gallery"}
      </Button>

      {open ? (
        <div className="space-y-2 rounded-xl border border-border bg-background p-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search gallery…"
            aria-label="Search Salama product gallery"
          />
          <div className="flex flex-wrap gap-1.5">
            <FilterChip active={category === "all"} onClick={() => setCategory("all")}>
              All
            </FilterChip>
            {CATEGORIES.map((c) => (
              <FilterChip key={c} active={category === c} onClick={() => setCategory(c)}>
                {c}
              </FilterChip>
            ))}
          </div>
          {items.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No gallery photos match.</p>
          ) : (
            <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto pr-0.5">
              {items.map((item) => {
                const busy = pickingId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!!pickingId}
                    onClick={() => onPick(item)}
                    className={cn(
                      "overflow-hidden rounded-lg border border-border bg-muted text-left transition-colors hover:border-primary disabled:opacity-60",
                      busy && "ring-2 ring-primary",
                    )}
                    title={item.name}
                  >
                    <img
                      src={galleryImageSrc(item)}
                      alt=""
                      className="h-16 w-full object-cover"
                    />
                    <span className="block truncate px-1.5 py-1 text-[10px] font-medium leading-tight">
                      {busy ? "Applying…" : item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px]",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-muted text-muted-foreground hover:bg-muted/80",
      )}
    >
      {children}
    </button>
  );
}
