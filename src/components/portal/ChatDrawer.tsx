import { useEffect, useRef, useState } from "react";
import { Send, Smartphone, MessageSquareText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { usePortal } from "@/lib/portal-store";
import { ApiError } from "@/lib/api-client";
import { formatApiError } from "@/lib/format-api-error";
import { cn } from "@/lib/utils";

export function ChannelBadge({ channel }: { channel: "in-app" | "offline-sms" }) {
  return channel === "in-app" ? (
    <Badge className="border-transparent bg-success text-success-foreground">
      <MessageSquareText className="mr-1 h-3 w-3" /> In-App Delivery
    </Badge>
  ) : (
    <Badge className="border-transparent bg-info text-info-foreground">
      <Smartphone className="mr-1 h-3 w-3" /> Offline SMS Delivery
    </Badge>
  );
}

export function ChatDrawer() {
  const { threads, openThreadId, openChat, sendMessage } = usePortal();
  const thread = threads.find((t) => t.id === openThreadId) ?? null;
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread?.messages.length, openThreadId, thread?.messagesLoaded]);

  return (
    <Sheet
      open={!!thread}
      onOpenChange={(o) => {
        if (!o) void openChat(null);
      }}
    >
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-md">
        {thread && (
          <>
            <SheetHeader className="border-b border-border p-4">
              <SheetTitle className="flex flex-wrap items-center gap-2">
                {thread.farmer}
                <ChannelBadge channel={thread.channel} />
              </SheetTitle>
              <SheetDescription>
                +{thread.phone} · {thread.topic}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4">
              {!thread.messagesLoaded ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Loading conversation…
                </p>
              ) : (
                <>
                  {thread.messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn("flex", m.from === "store" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                          m.from === "store"
                            ? "rounded-br-sm bg-primary text-primary-foreground"
                            : "rounded-bl-sm bg-card text-card-foreground",
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        <span className="mt-1 block text-[10px] opacity-70">{m.time}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={endRef} />
                </>
              )}
            </div>

            <form
              className="flex items-center gap-2 border-t border-border p-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!text.trim() || sending || !thread.messagesLoaded) return;
                void (async () => {
                  setSending(true);
                  try {
                    await sendMessage(thread.id, text.trim());
                    setText("");
                  } catch (err) {
                    toast.error(
                      err instanceof ApiError ? formatApiError(err) : "Could not send message.",
                    );
                  } finally {
                    setSending(false);
                  }
                })();
              }}
            >
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={sending || !thread.messagesLoaded}
                placeholder={
                  thread.channel === "in-app"
                    ? "Reply in app…"
                    : "Record reply (SMS gateway not connected)…"
                }
              />
              <Button
                type="submit"
                size="icon"
                disabled={!text.trim() || sending || !thread.messagesLoaded}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
