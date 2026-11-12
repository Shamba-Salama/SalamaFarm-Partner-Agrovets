import { useEffect, useId, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { uploadImage } from "@/lib/upload-image";
import { ApiError } from "@/lib/api-client";
import { formatApiError } from "@/lib/format-api-error";
import { cn } from "@/lib/utils";

type Props = {
  /** Current image URL (from server or after upload). */
  value: string | null;
  /** Called with the public URL after a successful R2 upload. */
  onUploaded: (url: string) => void;
  /** Called when the user removes the photo (optional). */
  onRemoved?: () => void;
  disabled?: boolean;
  className?: string;
};

export function ImageUploader({ value, onUploaded, onRemoved, disabled, className }: Props) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const shownImage = previewUrl || value;

  const onPick = async (file: File | null) => {
    if (!file || disabled || busy) return;
    setError(null);
    setProgress(null);
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    const local = URL.createObjectURL(file);
    setPreviewUrl(local);

    setBusy(true);
    try {
      const url = await uploadImage(file, (pct) => setProgress(pct));
      onUploaded(url);
      URL.revokeObjectURL(local);
      setPreviewUrl(null);
      setProgress(null);
    } catch (e) {
      URL.revokeObjectURL(local);
      setPreviewUrl(null);
      const message =
        e instanceof ApiError
          ? formatApiError(e)
          : e instanceof Error
            ? e.message
            : "Could not upload the image.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const onClear = () => {
    setError(null);
    setProgress(null);
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    onRemoved?.();
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={inputId}>Product image</Label>
      <label
        htmlFor={inputId}
        className={cn(
          "flex cursor-pointer flex-col gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm transition-colors hover:bg-muted",
          (disabled || busy) && "pointer-events-none opacity-70",
        )}
      >
        {shownImage ? (
          <img
            src={shownImage}
            alt=""
            className="mx-auto h-32 w-full max-w-xs rounded-lg object-cover"
          />
        ) : (
          <div className="flex items-center gap-3 text-muted-foreground">
            {busy ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5 shrink-0" />
            )}
            <span className="min-w-0">
              {busy ? "Uploading to storage…" : "Upload product photo (JPEG, PNG or WebP)"}
            </span>
          </div>
        )}
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          className="hidden"
          disabled={disabled || busy}
          onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
        />
        <p className="text-xs text-muted-foreground">
          Optional. Max 5 MB. Farmers see this photo in the mobile marketplace.
        </p>
        {busy && progress !== null ? (
          <Progress value={progress} className="h-2" />
        ) : null}
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {value || previewUrl ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit px-0 text-muted-foreground"
          onClick={onClear}
          disabled={disabled || busy}
        >
          Remove photo
        </Button>
      ) : null}
    </div>
  );
}
