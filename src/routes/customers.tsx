import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Send } from "lucide-react";
import { toast } from "sonner";

import { PortalLayout } from "@/components/portal/PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChannelBadge } from "@/components/portal/ChatDrawer";
import {
  FOLLOW_UP_TEMPLATES,
  usePortal,
  type CustomerOrder,
  type FollowUpStatus,
} from "@/lib/portal-store";
import { ApiError } from "@/lib/api-client";
import { formatApiError } from "@/lib/format-api-error";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customer Follow-Up Hub | SalamaFarm Partner Agrovets" },
      {
        name: "description",
        content:
          "Send templated post-purchase follow-ups to farmers in-app or through the SalamaFarm Bulk SMS Gateway.",
      },
      { property: "og:title", content: "Customer Follow-Up Hub | SalamaFarm Partner Agrovets" },
      {
        property: "og:description",
        content: "Templated pest, fertilizer and vaccine reminders for every buyer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomersPage,
});

const statuses: FollowUpStatus[] = ["Pending", "Contacted", "Satisfied"];

function CustomersPage() {
  const { orders, ordersLoading, setOrderStatus } = usePortal();
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<CustomerOrder | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const rows = orders.filter(
    (o) =>
      o.customer.toLowerCase().includes(query.toLowerCase()) ||
      o.phone.includes(query) ||
      o.product.toLowerCase().includes(query.toLowerCase()),
  );

  const filtersActive = query.trim().length > 0;

  const onStatusChange = async (id: string, status: FollowUpStatus) => {
    if (busyId) return;
    setBusyId(id);
    try {
      await setOrderStatus(id, status);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? formatApiError(err) : "Could not update follow-up status.",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PortalLayout
      title="Customer Care & Follow-Ups"
      subtitle={`${orders.filter((o) => o.status === "Pending").length} customers awaiting a check-in`}
    >
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, phone or product…"
              className="pl-9"
            />
          </div>

          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Item purchased</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Order type</TableHead>
                  <TableHead>Platform channel</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersLoading && orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      Loading customers…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 && orders.length === 0 && !filtersActive ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      No customers yet
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      No customers match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="min-w-[150px]">
                        <span className="block font-medium">{o.customer}</span>
                        <span className="block text-xs text-muted-foreground">+{o.phone}</span>
                      </TableCell>
                      <TableCell className="min-w-[170px]">{o.product}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {o.date}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{o.orderType}</TableCell>
                      <TableCell>
                        <ChannelBadge channel={o.channel} />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={o.status}
                          disabled={busyId === o.id}
                          onValueChange={(v) => void onStatusChange(o.id, v as FollowUpStatus)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => setTarget(o)}>
                          <Send className="mr-1.5 h-4 w-4" /> Send Follow-Up
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <FollowUpDialog order={target} onClose={() => setTarget(null)} />
    </PortalLayout>
  );
}

function FollowUpDialog({ order, onClose }: { order: CustomerOrder | null; onClose: () => void }) {
  const { startThread, setOrderStatus } = usePortal();
  const [templateId, setTemplateId] = useState<string>(FOLLOW_UP_TEMPLATES[0].id);
  const template = FOLLOW_UP_TEMPLATES.find((t) => t.id === templateId) ?? FOLLOW_UP_TEMPLATES[0];
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const text = body || (order ? template.body(order.customer, order.product) : "");

  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {order && (
          <>
            <DialogHeader>
              <DialogTitle>Send follow-up to {order.customer}</DialogTitle>
              <DialogDescription>
                {order.channel === "in-app"
                  ? "Marks follow-up status on the order. Message delivery is not yet wired to the API."
                  : "Marks follow-up status on the order. Bulk SMS delivery is not yet wired to the API."}
              </DialogDescription>
            </DialogHeader>

            <ChannelBadge channel={order.channel} />

            <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <strong className="text-foreground">Known gap:</strong> chat/SMS delivery stays local
              until the messaging pass. Status update to Contacted is a real API PATCH.
            </p>

            <div className="space-y-1.5">
              <Label>Template</Label>
              <Select
                value={templateId}
                onValueChange={(v) => {
                  setTemplateId(v);
                  setBody("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOLLOW_UP_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea rows={5} value={text} onChange={(e) => setBody(e.target.value)} />
            </div>

            <DialogFooter>
              <Button
                className="w-full"
                disabled={sending}
                onClick={() => {
                  void (async () => {
                    setSending(true);
                    try {
                      startThread(order.customer, order.phone, order.channel, order.product, text);
                      await setOrderStatus(order.id, "Contacted");
                      onClose();
                      setBody("");
                      toast.success(
                        order.channel === "in-app"
                          ? "Status updated · message kept local (messaging API not wired yet)"
                          : "Status updated · SMS kept local (messaging API not wired yet)",
                      );
                    } catch (err) {
                      toast.error(
                        err instanceof ApiError ? formatApiError(err) : "Could not update status.",
                      );
                    } finally {
                      setSending(false);
                    }
                  })();
                }}
              >
                <Send className="mr-1.5 h-4 w-4" /> {sending ? "Saving…" : "Send follow-up"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
