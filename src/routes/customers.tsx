import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle, Phone, Search } from "lucide-react";

import { PortalLayout } from "@/components/portal/PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { usePortal, type FollowUpStatus } from "@/lib/portal-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customer Care Hub | SalamaFarm Partner Agrovets" },
      {
        name: "description",
        content:
          "Post-purchase follow-ups with one-tap WhatsApp and direct call shortcuts for every farmer who bought from your agrovet.",
      },
      { property: "og:title", content: "Customer Care Hub | SalamaFarm Partner Agrovets" },
      {
        property: "og:description",
        content: "Track follow-up status and reach farmers on WhatsApp or by phone in one tap.",
      },
    ],
  }),
  component: CustomersPage,
});

const statuses: FollowUpStatus[] = ["Pending", "Contacted", "Satisfied"];

function CustomersPage() {
  const { orders, setOrderStatus, profile } = usePortal();
  const [query, setQuery] = useState("");

  const rows = orders.filter(
    (o) =>
      o.customer.toLowerCase().includes(query.toLowerCase()) ||
      o.phone.includes(query) ||
      o.mpesaCode.toLowerCase().includes(query.toLowerCase()),
  );

  const waLink = (phone: string, product: string, date: string) =>
    `https://wa.me/${phone}?text=${encodeURIComponent(
      `Habari! This is ${profile.name}. Just checking in to see if the ${product} you bought on ${date} worked well for your farm?`,
    )}`;

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
              placeholder="Search name, phone or M-Pesa code…"
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
                  <TableHead>M-Pesa code</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead className="text-right">Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="min-w-[150px]">
                      <span className="block font-medium">{o.customer}</span>
                      <span className="block text-xs text-muted-foreground">+{o.phone}</span>
                    </TableCell>
                    <TableCell className="min-w-[180px]">{o.product}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{o.date}</TableCell>
                    <TableCell className="font-mono text-xs">{o.mpesaCode}</TableCell>
                    <TableCell>
                      <Select
                        value={o.status}
                        onValueChange={(v) => setOrderStatus(o.id, v as FollowUpStatus)}
                      >
                        <SelectTrigger className="w-[140px]">
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
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild size="sm">
                          <a href={waLink(o.phone, o.product, o.date)} target="_blank" rel="noreferrer">
                            <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
                          </a>
                        </Button>
                        <Button asChild size="icon" variant="outline">
                          <a href={`tel:+${o.phone}`} aria-label={`Call ${o.customer}`}>
                            <Phone className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      No customers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {statuses.map((s) => (
          <Card key={s}>
            <CardContent className="flex items-center justify-between p-4">
              <span className="text-sm text-muted-foreground">{s}</span>
              <Badge
                className={cn(
                  "border-transparent",
                  s === "Pending" && "bg-warning text-warning-foreground",
                  s === "Contacted" && "bg-secondary text-secondary-foreground",
                  s === "Satisfied" && "bg-success text-success-foreground",
                )}
              >
                {orders.filter((o) => o.status === s).length}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </PortalLayout>
  );
}
