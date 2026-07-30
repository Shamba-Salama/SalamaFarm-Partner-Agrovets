import { createFileRoute, Link } from "@tanstack/react-router";
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
import { CircleDollarSign, Package, PhoneCall, Plus, Receipt, Store, Users } from "lucide-react";

import { PortalLayout } from "@/components/portal/PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatKES, usePortal, weeklySales } from "@/lib/portal-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agrovet Dashboard | SalamaFarm Partner Portal" },
      {
        name: "description",
        content:
          "Track M-Pesa sales, inventory and customer follow-ups for your agrovet store on the SalamaFarm partner portal.",
      },
      { property: "og:title", content: "Agrovet Dashboard | SalamaFarm Partner Portal" },
      {
        property: "og:description",
        content: "Sales analytics, inventory and customer care for SalamaFarm partner agrovets.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { products, orders, transactions, profile, setProfile } = usePortal();

  const revenue =
    transactions.filter((t) => t.pickup !== "Unmatched").reduce((s, t) => s + t.amount, 0) +
    weeklySales.reduce((s, w) => s + w.Fertilizer + w.Seeds + w["Vet Supplies"] + w.Pesticides, 0);
  const activeProducts = products.filter((p) => p.active).length;
  const pendingFollowUps = orders.filter((o) => o.status === "Pending").length;

  const totals = weeklySales.reduce(
    (acc, w) => {
      acc.Fertilizer += w.Fertilizer;
      acc.Seeds += w.Seeds;
      acc["Vet Supplies"] += w["Vet Supplies"];
      acc.Pesticides += w.Pesticides;
      return acc;
    },
    { Fertilizer: 0, Seeds: 0, "Vet Supplies": 0, Pesticides: 0 } as Record<string, number>,
  );
  const trend = weeklySales.map((w) => ({
    week: w.week,
    total: w.Fertilizer + w.Seeds + w["Vet Supplies"] + w.Pesticides,
  }));

  return (
    <PortalLayout
      title="Dashboard Overview"
      subtitle="Weekly performance for your counter"
      actions={
        <>
          <Button asChild size="sm">
            <Link to="/inventory">
              <Plus className="mr-1.5 h-4 w-4" /> Add New Product
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setProfile({ open: !profile.open })}
            className="hidden sm:inline-flex"
          >
            <Store className="mr-1.5 h-4 w-4" />
            {profile.open ? "Close Store" : "Open Store"}
          </Button>
          <Button asChild size="sm" variant="outline" className="hidden md:inline-flex">
            <Link to="/mpesa">
              <Receipt className="mr-1.5 h-4 w-4" /> M-Pesa Log
            </Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={CircleDollarSign}
          label="Direct Sales Revenue"
          value={formatKES(revenue)}
          hint="Settled via Till 5203817"
        />
        <Metric
          icon={Package}
          label="Active Products Listed"
          value={String(activeProducts)}
          hint={`${products.length} total in catalogue`}
        />
        <Metric icon={PhoneCall} label="App Visits / Calls" value="486" hint="+12% vs last week" />
        <Metric
          icon={Users}
          label="Pending Follow-Ups"
          value={String(pendingFollowUps)}
          hint="Customers awaiting a check-in"
        />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly sales by category (KES)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklySales} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickFormatter={(v) => `${v / 1000}k`} fontSize={12} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => formatKES(v)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Fertilizer" stackId="a" fill="var(--chart-1)" />
                <Bar dataKey="Seeds" stackId="a" fill="var(--chart-2)" />
                <Bar dataKey="Vet Supplies" stackId="a" fill="var(--chart-3)" />
                <Bar dataKey="Pesticides" stackId="a" radius={[6, 6, 0, 0]} fill="var(--chart-4)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Revenue trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[150px] pl-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <XAxis dataKey="week" fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => formatKES(v)} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(totals)
                .sort((a, b) => b[1] - a[1])
                .map(([name, value]) => (
                  <div key={name} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-muted-foreground">{name}</span>
                    <Badge variant="secondary" className="shrink-0">
                      {formatKES(value)}
                    </Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="truncate text-xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}
