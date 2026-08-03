import { createFileRoute } from "@tanstack/react-router";
import { MessageSquareText } from "lucide-react";

import { PortalLayout } from "@/components/portal/PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChannelBadge } from "@/components/portal/ChatDrawer";
import { usePortal } from "@/lib/portal-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Farmer Messages | SalamaFarm Partner Agrovets" },
      {
        name: "description",
        content:
          "In-app direct messaging with farmers, with real-time alerts and automatic SMS routing for offline customers.",
      },
      { property: "og:title", content: "Farmer Messages | SalamaFarm Partner Agrovets" },
      {
        property: "og:description",
        content: "Reply to crop and livestock inquiries from your counter in real time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const { threads, openChat, unreadMessages } = usePortal();

  return (
    <PortalLayout
      title="Farmer Messages"
      subtitle={`${threads.length} conversations · ${unreadMessages} unread`}
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {threads.map((t) => {
          const last = t.messages[t.messages.length - 1];
          return (
            <Card key={t.id} className={cn(t.unread > 0 && "ring-2 ring-primary/40")}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{t.farmer}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      +{t.phone} · {t.topic}
                    </p>
                  </div>
                  {t.unread > 0 && (
                    <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                      {t.unread}
                    </span>
                  )}
                </div>
                <ChannelBadge channel={t.channel} />
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {last ? `${last.from === "store" ? "You: " : ""}${last.text}` : "No messages yet"}
                </p>
                <Button size="sm" className="w-full" onClick={() => openChat(t.id)}>
                  <MessageSquareText className="mr-1.5 h-4 w-4" /> Open chat
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PortalLayout>
  );
}
