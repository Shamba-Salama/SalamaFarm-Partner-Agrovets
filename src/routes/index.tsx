import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  MessagesSquare,
  Package,
  Receipt,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PortalLayout } from "@/components/portal/PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatKES, stockStatus, usePortal, weeklySales } from "@/lib/portal-store";
import { ChannelBadge } from "@/components/portal/ChatDrawer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vendor Dashboard | SalamaFarm Partner Agrovets" },
      {
        name: "description",
        content:
          "Live revenue, stock alerts, farmer messages and follow-up metrics for your SalamaFarm partner agrovet store.",
      },
      { property: "og:title", content: "Vendor Dashboard | SalamaFarm Partner Agrovets" },
      {
        property: "og:description",
        content: "Track sales trends, inventory health and customer follow-ups in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { orders, products, threads, unreadMessages, profile } = usePortal();

  const revenue = orders.reduce((s, o) => s + o.amount, 0);
  const pending = orders.filter((o) => o.status === "Pending").length;
  const alerts = products.filter((p) => stockStatus(p) !== "In Stock");

  const trend = weeklySales.map((w) => ({
    week: w.week,
    Revenue: w.Fertilizer + w.Seeds + w["Vet Supplies"] + w.Pesticides,
  }));

  const storeLabel = profile.name || "Your store";

  return (
    <PortalLayout title="Dashboard Overview" subtitle={`${storeLabel} · last 6 weeks`}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={TrendingUp} label="Total revenue" value={formatKES(revenue)} note="All recorded M-Pesa sales" />
        <Metric icon={Package} label="Active products" value={String(products.filter((p) => p.active).length)} note={`${alerts.length} need attention`} />
        <Metric icon={MessagesSquare} label="Unread messages" value={String(unreadMessages)} note={`${threads.length} farmer conversations`} />
        <Metric icon={Users} label="Pending follow-ups" value={String(pending)} note="Customers awaiting a check-in" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly sales by category</CardTitle>
          </CardHeader>
          <CardContent className="h-72 pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="week" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} width={54} />
                <Tooltip formatter={(v: number) => formatKES(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Fertilizer" stackId="a" fill="var(--color-primary)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Seeds" stackId="a" fill="var(--color-success)" />
                <Bar dataKey="Vet Supplies" stackId="a" fill="var(--color-info)" />
                <Bar dataKey="Pesticides" stackId="a" fill="var(--color-warning)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue trend</CardTitle>
          </CardHeader>
          <CardContent className="h-72 pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="week" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} width={54} />
                <Tooltip formatter={(v: number) => formatKES(v)} />
                <Line type="monotone" dataKey="Revenue" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" /> Stock & expiry alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg bg-muted/50 p-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-card text-lg">
                  {p.image}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {p.stock} in stock · expires {p.expiry}
                  </span>
                </span>
                <Badge variant="secondary" className="shrink-0">
                  {stockStatus(p)}
                </Badge>
              </div>
            ))}
            {!alerts.length && (
              <p className="py-6 text-center text-sm text-muted-foreground">All stock is healthy.</p>
            )}
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/inventory">Manage inventory</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4 text-primary" /> Latest orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 p-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{o.customer}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {o.product} · {o.mpesaCode}
                  </span>
                </span>
                <ChannelBadge channel={o.channel} />
                <span className="text-sm font-semibold tabular-nums">{formatKES(o.amount)}</span>
              </div>
            ))}
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/orders">Open sales & orders log</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-2 truncate text-2xl font-bold tabular-nums tracking-tight">{value}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}
