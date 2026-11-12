import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Check,
  LayoutDashboard,
  Leaf,
  MapPin,
  MessagesSquare,
  Package,
  Receipt,
  Sprout,
  Store,
  TrendingUp,
  Users,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
import { BrandLogo } from "@/components/BrandLogo";
import { AuthLoadingScreen } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { formatKES, prepareWeeklySalesChartRows, stockStatus, usePortal } from "@/lib/portal-store";
import { ChannelBadge } from "@/components/portal/ChatDrawer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Welcome to SalamaFarm | Partner Agrovets" },
      {
        name: "description",
        content:
          "A simpler way to manage your agrovet, reach farmers, and keep track of every order.",
      },
      { property: "og:title", content: "Welcome to SalamaFarm | Partner Agrovets" },
      {
        property: "og:description",
        content: "Your stock, orders, farmer messages, and sales — all in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) return <AuthLoadingScreen />;
  if (isAuthenticated) return <DashboardPage />;
  return <LandingPage />;
}

const FEATURES = [
  {
    icon: Package,
    title: "Product Management",
    text: "Manage your agrovet products in one place. Upload, update, and organize products available for farmers.",
  },
  {
    icon: MessagesSquare,
    title: "Farmer Communication",
    text: "Connect with farmers, respond to questions, and provide agricultural support.",
  },
  {
    icon: Store,
    title: "Agrovet Profile Management",
    text: "Maintain your agrovet information and manage your digital presence.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard Overview",
    text: "Monitor your agrovet activities through a simple dashboard experience.",
  },
];

const STEPS = [
  {
    number: "01",
    icon: UserRound,
    title: "Create Your Agrovet Account",
    text: "Register your agrovet through the existing partner sign-up.",
  },
  {
    number: "02",
    icon: Store,
    title: "Set Up Your Agrovet Profile",
    text: "Add and maintain the information farmers use to find your store.",
  },
  {
    number: "03",
    icon: Package,
    title: "Upload And Manage Products",
    text: "Keep your product catalogue organized and up to date.",
  },
  {
    number: "04",
    icon: MessagesSquare,
    title: "Connect With Farmers",
    text: "Respond to farmer questions through partner messaging.",
  },
  {
    number: "05",
    icon: Sprout,
    title: "Grow Your Agrovet Presence",
    text: "Bring your products, conversations, and store information together.",
  },
];

function LandingPage() {
  return (
    <main className="landing-page min-h-svh overflow-hidden">
      <div className="landing-glow landing-glow-one" aria-hidden />
      <div className="landing-glow landing-glow-two" aria-hidden />

      <header className="landing-enter relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link to="/" aria-label="SalamaFarm home">
          <BrandLogo tone="plain" showPartnerLabel markClassName="h-10 sm:h-11" />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3" aria-label="Main navigation">
          <a
            href="#features"
            className="hidden rounded-full px-3 py-2 text-sm font-semibold text-foreground/75 transition hover:bg-white/60 hover:text-primary sm:inline-flex sm:px-4"
          >
            Explore the platform
          </a>
          <Link
            to="/login"
            className="rounded-full px-3 py-2 text-sm font-semibold text-foreground/80 transition hover:bg-white/60 hover:text-primary sm:px-4"
          >
            Sign In
          </Link>
          <Link
            to="/onboarding"
            className="hidden items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition hover:-translate-y-0.5 hover:bg-primary/90 sm:inline-flex sm:px-5"
          >
            Create Account <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100svh-5rem)] w-full max-w-7xl items-center gap-10 px-5 pb-16 pt-6 sm:px-8 sm:pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-12">
        <div className="landing-enter landing-delay-1 landing-glass rounded-[2rem] p-6 sm:p-9 lg:p-11">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/55 px-3.5 py-2 text-xs font-semibold tracking-wide text-primary shadow-sm backdrop-blur-xl sm:text-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            YOUR AGROVET, CONNECTED
          </div>
          <h1 className="font-display max-w-xl text-4xl leading-[1.07] font-extrabold tracking-[-0.045em] text-foreground sm:text-5xl md:text-6xl">
            Welcome to Salama Farm
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-7 font-semibold text-primary sm:text-xl sm:leading-8">
            Empowering Agrovet Partners to manage products, connect with farmers, and grow their
            agricultural services.
          </p>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Manage your agrovet operations, upload products, communicate with farmers, and provide
            better agricultural support through one simple dashboard.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/onboarding"
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/20 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/25"
            >
              Create Agrovet Account
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
            <Link
              to="/login"
              className="inline-flex min-h-12 items-center justify-center gap-1 rounded-full border border-white/80 bg-white/50 px-5 py-3 text-sm font-semibold text-foreground shadow-sm backdrop-blur-xl transition hover:bg-white/80"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground sm:text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-primary" aria-hidden /> Made for agrovet partners
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-primary" aria-hidden /> Connected to farmers
            </span>
          </div>
        </div>

        <div className="landing-enter landing-delay-2 relative mx-auto w-full max-w-[34rem] lg:ml-auto">
          <div className="absolute -left-7 top-16 z-10 hidden -rotate-6 items-center gap-3 rounded-2xl border border-white/70 bg-white/75 p-3.5 shadow-xl shadow-emerald-950/10 backdrop-blur-xl sm:flex">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-xs text-muted-foreground">Your business</span>
              <span className="block text-sm font-bold text-foreground">Moving forward</span>
            </span>
          </div>
          <div className="absolute -right-3 bottom-14 z-10 hidden rotate-3 items-center gap-3 rounded-2xl border border-white/70 bg-white/75 p-3.5 shadow-xl shadow-emerald-950/10 backdrop-blur-xl sm:flex">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <MessagesSquare className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-xs text-muted-foreground">Farmer messages</span>
              <span className="block text-sm font-bold text-foreground">
                A little closer, daily
              </span>
            </span>
          </div>

          <div className="landing-glass relative overflow-hidden rounded-[2rem] p-3 shadow-2xl shadow-emerald-950/10 sm:rounded-[2.5rem] sm:p-4">
            <div
              className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/25 to-primary/10"
              aria-hidden
            />
            <div className="relative rounded-[1.45rem] border border-white/80 bg-white/75 p-4 backdrop-blur-2xl sm:rounded-[2rem] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/15">
                    <Leaf className="h-5 w-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-foreground">Your agrovet</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      Ready for a fresh start
                    </span>
                  </span>
                </div>
                <span className="rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5 text-[11px] font-semibold text-primary">
                  PARTNER SPACE
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-medium">Inventory</span>
                    <Package className="h-4 w-4 text-primary" aria-hidden />
                  </div>
                  <p className="font-display mt-3 text-lg font-bold tracking-tight text-foreground">
                    Product management
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Organize your products</p>
                </div>
                <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-medium">Messages</span>
                    <MessagesSquare className="h-4 w-4 text-primary" aria-hidden />
                  </div>
                  <p className="font-display mt-3 text-lg font-bold tracking-tight text-foreground">
                    Farmer conversations
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Connect and offer support
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white bg-white/80 p-4 shadow-sm sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">Dashboard Overview</span>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/7 text-primary">
                    <BarChart3 className="h-4 w-4" aria-hidden />
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { icon: TrendingUp, label: "Sales overview" },
                    { icon: Package, label: "Active products" },
                    { icon: MessagesSquare, label: "Farmer messages" },
                    { icon: Users, label: "Follow-ups" },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 rounded-xl border border-border/60 bg-white/75 p-3"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/90 bg-primary/5 p-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-primary shadow-sm">
                  <Activity className="h-4 w-4" aria-hidden />
                </span>
                <p className="text-xs leading-relaxed text-foreground/75">
                  Products, farmer conversations, and orders in one portal.
                </p>
              </div>
            </div>
          </div>
          <div
            className="pointer-events-none absolute -bottom-10 -left-10 -z-10 h-48 w-48 rounded-full bg-success/20 blur-3xl"
            aria-hidden
          />
        </div>
      </section>

      <section
        id="features"
        className="relative z-10 scroll-mt-8 border-y border-white/60 bg-white/35 px-5 py-16 backdrop-blur-sm sm:px-8 sm:py-20 lg:px-12"
      >
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="mb-10 max-w-2xl sm:mb-12">
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
              Made for your day-to-day
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Your agrovet, all in one place.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Simple tools for the products, farmer conversations, and store details you already
              manage.
            </p>
          </ScrollReveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, text }, index) => (
              <ScrollReveal key={title} delay={index * 80}>
                <article className="landing-glass h-full rounded-3xl p-6 transition duration-300 hover:-translate-y-1 hover:bg-white/65 hover:shadow-xl sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/8 text-primary">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                  </div>
                  <h3 className="font-display mt-6 text-lg font-bold tracking-tight text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="mb-10 max-w-2xl sm:mb-12">
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
              How it works
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              A simple path to grow together.
            </h2>
          </ScrollReveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" role="list">
            {STEPS.map(({ number, icon: Icon, title, text }, index) => (
              <ScrollReveal key={number} delay={index * 70}>
                <article
                  className="landing-glass h-full rounded-3xl p-5 transition duration-300 hover:-translate-y-1 hover:bg-white/65 sm:p-6"
                  role="listitem"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/8 text-primary">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="font-display text-sm font-bold tracking-widest text-primary/45">
                      {number}
                    </span>
                  </div>
                  <h3 className="font-display mt-5 text-base font-bold leading-snug text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/60 bg-white/35 px-5 py-16 backdrop-blur-sm sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <ScrollReveal>
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
              A look inside
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              A dashboard built around your work.
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
              Sign in to manage your inventory, follow farmer conversations, review orders, and
              update your store settings in the existing partner portal.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <DashboardPreview />
          </ScrollReveal>
        </div>
      </section>

      <section className="relative z-10 px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <ScrollReveal className="landing-glass mx-auto max-w-5xl rounded-[2rem] px-6 py-12 text-center sm:px-12 sm:py-16">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/8 text-primary">
            <Leaf className="h-6 w-6" aria-hidden />
          </span>
          <h2 className="font-display mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to grow your agrovet business?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Join Salama Farm and become part of a connected agricultural ecosystem.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/onboarding"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90"
            >
              Create Agrovet Account <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              to="/login"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/80 bg-white/60 px-6 py-3 text-sm font-semibold text-foreground shadow-sm backdrop-blur-xl transition hover:bg-white/90"
            >
              Already a partner? Sign In
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <footer className="relative z-10 mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-7 text-center sm:flex-row sm:px-8 sm:text-left lg:px-12">
        <p className="text-xs text-muted-foreground">
          Rooted in community. Growing with SalamaFarm.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Continue to your account <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </footer>
    </main>
  );
}

function DashboardPreview() {
  const areas = [
    { icon: LayoutDashboard, label: "Overview" },
    { icon: Package, label: "Inventory" },
    { icon: MessagesSquare, label: "Messages" },
    { icon: Receipt, label: "Orders" },
    { icon: Users, label: "Follow-Ups" },
    { icon: Store, label: "Settings" },
  ];

  return (
    <div
      className="landing-glass relative overflow-hidden rounded-[2rem] p-3 shadow-2xl shadow-emerald-950/10 sm:rounded-[2.5rem] sm:p-4"
      role="img"
      aria-label="Illustration of the partner dashboard navigation and its overview, inventory, messages, orders, follow-ups, and settings sections"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/75 via-white/25 to-primary/10" />
      <div className="relative overflow-hidden rounded-[1.45rem] border border-white/80 bg-white/80 backdrop-blur-2xl sm:rounded-[2rem]">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-bold text-foreground">Partner dashboard</span>
              <span className="block text-xs text-muted-foreground">Salama Farm Agrovet</span>
            </span>
          </div>
          <span className="hidden rounded-full bg-primary/5 px-3 py-1.5 text-[11px] font-semibold text-primary sm:inline-flex">
            OVERVIEW
          </span>
        </div>
        <div className="grid min-h-64 sm:grid-cols-[9rem_1fr]">
          <nav
            className="grid grid-cols-3 gap-1 border-b border-border/60 p-2 sm:block sm:space-y-1 sm:border-r sm:border-b-0 sm:p-3"
            aria-label="Dashboard areas preview"
          >
            {areas.map(({ icon: Icon, label }, index) => (
              <span
                key={label}
                className={`flex items-center gap-2 rounded-lg px-2 py-2 text-[11px] font-medium sm:px-2.5 ${
                  index === 0 ? "bg-primary/8 text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">{label}</span>
              </span>
            ))}
          </nav>
          <div className="min-w-0 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-sm font-bold text-foreground">Dashboard Overview</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Your agrovet activity at a glance
                </span>
              </span>
              <BarChart3 className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {[
                { icon: TrendingUp, label: "Sales overview" },
                { icon: Package, label: "Active products" },
                { icon: MessagesSquare, label: "Farmer messages" },
                { icon: Users, label: "Follow-ups" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="rounded-xl border border-border/60 bg-white/75 p-3 shadow-sm"
                >
                  <Icon className="h-4 w-4 text-primary" aria-hidden />
                  <span className="mt-2 block text-[11px] font-semibold text-foreground">
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-border/60 bg-white/75 p-3">
              <Activity className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="text-[11px] font-medium text-muted-foreground">
                Products, conversations, and orders in one portal
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScrollReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`landing-reveal ${isVisible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function DashboardPage() {
  const {
    orders,
    products,
    threads,
    unreadMessages,
    profile,
    weeklySales,
    weeklySalesLoading,
    weeklySalesReady,
    appVisits,
    appVisitsLoading,
    appVisitsReady,
  } = usePortal();

  const revenue = orders.reduce((s, o) => s + o.amount, 0);
  const pending = orders.filter((o) => o.status === "Pending").length;
  const alerts = products.filter((p) => stockStatus(p) !== "In Stock");
  const appVisitsHeadline = appVisitsReady
    ? String(appVisits?.arrivedThisWeek ?? 0)
    : appVisitsLoading
      ? "…"
      : "—";
  const appVisitsNote = appVisitsReady
    ? `${appVisits?.arrivedCount ?? 0} arrived total · ${appVisits?.startedCount ?? 0} in progress`
    : "Customer Get Directions arrivals";

  const chartRows = prepareWeeklySalesChartRows(weeklySales);
  const weekCount = chartRows.length;
  const trend = chartRows.map((w) => ({
    week: w.week,
    Revenue: w.Fertilizer + w.Seeds + w["Vet Supplies"] + w.Pesticides,
  }));

  const storeLabel = profile.name || "Your store";
  const subtitle =
    weekCount > 0
      ? `${storeLabel} · last ${weekCount} week${weekCount === 1 ? "" : "s"}`
      : `${storeLabel} · weekly sales`;

  const chartsBusy = weeklySalesLoading && !weeklySalesReady;
  const chartsEmpty = weeklySalesReady && chartRows.length === 0;

  return (
    <PortalLayout title="Dashboard Overview" subtitle={subtitle}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:gap-4">
        <Metric
          icon={TrendingUp}
          label="Total revenue"
          value={formatKES(revenue)}
          note="All recorded M-Pesa sales"
        />
        <Metric
          icon={Package}
          label="Active products"
          value={String(products.filter((p) => p.active).length)}
          note={`${alerts.length} need attention`}
        />
        <Metric
          icon={MessagesSquare}
          label="Unread messages"
          value={String(unreadMessages)}
          note={`${threads.length} farmer conversations`}
        />
        <Metric
          icon={Users}
          label="Pending follow-ups"
          value={String(pending)}
          note="Customers awaiting a check-in"
        />
        <Metric icon={MapPin} label="App Visits" value={appVisitsHeadline} note={appVisitsNote} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly sales by category</CardTitle>
          </CardHeader>
          <CardContent className="h-56 min-w-0 overflow-x-auto pl-0 sm:h-72">
            {chartsBusy ? (
              <p className="grid h-full place-items-center text-sm text-muted-foreground">
                Loading weekly sales…
              </p>
            ) : chartsEmpty ? (
              <p className="grid h-full place-items-center text-sm text-muted-foreground">
                No sales recorded yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={280}>
                <BarChart data={chartRows} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="week" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} width={44} />
                  <Tooltip formatter={(v: number) => formatKES(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar
                    dataKey="Fertilizer"
                    stackId="a"
                    fill="var(--color-primary)"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar dataKey="Seeds" stackId="a" fill="var(--color-success)" />
                  <Bar dataKey="Vet Supplies" stackId="a" fill="var(--color-info)" />
                  <Bar
                    dataKey="Pesticides"
                    stackId="a"
                    fill="var(--color-warning)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue trend</CardTitle>
          </CardHeader>
          <CardContent className="h-56 min-w-0 overflow-x-auto pl-0 sm:h-72">
            {chartsBusy ? (
              <p className="grid h-full place-items-center text-sm text-muted-foreground">
                Loading…
              </p>
            ) : chartsEmpty ? (
              <p className="grid h-full place-items-center text-sm text-muted-foreground">
                No sales recorded yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={280}>
                <LineChart data={trend} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="week" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} width={44} />
                  <Tooltip formatter={(v: number) => formatKES(v)} />
                  <Line
                    type="monotone"
                    dataKey="Revenue"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
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
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-md border border-border p-2.5"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-lg">
                  {p.image}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {p.stock} in stock · {p.expiry ? `expires ${p.expiry}` : "no expiry date"}
                  </span>
                </span>
                <Badge variant="secondary" className="shrink-0">
                  {stockStatus(p)}
                </Badge>
              </div>
            ))}
            {!alerts.length && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                All stock is healthy.
              </p>
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
              <div
                key={o.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2.5"
              >
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
          <span className="grid h-8 w-8 place-items-center rounded-md border border-border bg-muted text-muted-foreground">
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-2 truncate text-2xl font-bold tabular-nums tracking-tight">{value}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}
