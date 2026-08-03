import { useEffect, useRef, useState } from "react";
import { Send, Smartphone, MessageSquareText } from "lucide-react";

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
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread?.messages.length, openThreadId]);

  return (
    <Sheet open={!!thread} onOpenChange={(o) => !o && openChat(null)}>
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
            </div>

            <form
              className="flex items-center gap-2 border-t border-border p-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!text.trim()) return;
                sendMessage(thread.id, text.trim());
                setText("");
              }}
            >
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  thread.channel === "in-app" ? "Reply in app…" : "Reply via Bulk SMS Gateway…"
                }
              />
              <Button type="submit" size="icon" disabled={!text.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
