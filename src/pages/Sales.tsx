import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { TIERS } from "@/config/subscriptionTiers";
import {
  MapPin,
  DollarSign,
  Package,
  Wrench,
  Car,
  Users,
  BarChart3,
  Target,
  CheckCircle2,
  ArrowRight,
  Zap,
  Shield,
  Star,
  QrCode,
} from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Location Management",
    description:
      "Track all your claw machine locations, contacts, commission rates, and collection schedules in one place.",
  },
  {
    icon: DollarSign,
    title: "Revenue Tracking",
    description:
      "Log income and expenses per location with charts, CSV exports, and automatic commission calculations.",
  },
  {
    icon: Package,
    title: "Inventory Management",
    description:
      "Monitor stock levels, set restock alerts, bulk-add items, and track supplier pricing across locations.",
  },
  {
    icon: QrCode,
    title: "Maintenance & QR Codes",
    description:
      "Generate QR codes for each machine so customers can report issues. Track and resolve maintenance tickets.",
  },
  {
    icon: Car,
    title: "Mileage Tracker",
    description:
      "Log trips with GPS tracking, build reusable routes, and calculate IRS tax deductions automatically.",
  },
  {
    icon: Target,
    title: "Leads CRM",
    description:
      "Manage your sales pipeline with a Kanban board. Convert prospects into active locations with one click.",
  },
  {
    icon: BarChart3,
    title: "Business Reports",
    description:
      "Six report categories covering locations, machines, finances, inventory, routes, and win-rate analytics.",
  },
  {
    icon: Users,
    title: "Team Management",
    description:
      "Invite technicians, drivers, and managers with role-based permissions to help run your operation.",
  },
];

const steps = [
  {
    number: "1",
    title: "Sign Up Free",
    description: "Create your account in seconds. No credit card required.",
  },
  {
    number: "2",
    title: "Add Your Locations",
    description:
      "Enter your claw machine locations, machines, and start tracking.",
  },
  {
    number: "3",
    title: "Grow Your Business",
    description:
      "Use data-driven insights to optimize revenue and expand your empire.",
  },
];

const freeFeatures = [
  "Up to 3 locations",
  "Revenue tracking",
  "Inventory management",
  "Mileage logging",
  "Maintenance reports",
  "Business reports",
];

const proFeatures = [
  "Unlimited locations",
  "Everything in Free",
  "Up to 5 team members",
  "Priority support",
  "Commission summaries",
  "Advanced analytics",
];

export default function Sales() {
  const [annual, setAnnual] = useState(false);

  const proPrice = annual ? TIERS.PRO.annual.amount : TIERS.PRO.monthly.amount;
  const proPeriod = annual ? "/yr" : "/mo";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-primary">Claw</span>Ops
          </span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <a href="#pricing">Pricing</a>
            </Button>
            <Button asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container relative mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-6">
            <Zap className="mr-1 h-3 w-3" /> Built for Claw Machine Operators
          </Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Run Your Claw Machine Empire from{" "}
            <span className="text-primary">One Dashboard</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Track locations, revenue, inventory, maintenance, mileage, and
            leads — all in one place. Stop juggling spreadsheets and start
            growing your business.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link to="/auth">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#pricing">See Pricing</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to Operate &amp; Scale
            </h2>
            <p className="mt-4 text-muted-foreground">
              Eight powerful modules designed specifically for claw machine
              businesses.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <Card
                key={f.title}
                className="group border-border/60 transition-shadow hover:shadow-hover"
              >
                <CardHeader className="pb-2">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {f.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-muted/40 py-20 sm:py-28">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Up &amp; Running in Minutes
          </h2>
          <div className="mt-14 grid gap-10 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.number} className="flex flex-col items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  {s.number}
                </div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free. Upgrade when you're ready.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <span
              className={`text-sm font-medium ${!annual ? "text-foreground" : "text-muted-foreground"}`}
            >
              Monthly
            </span>
            <Switch checked={annual} onCheckedChange={setAnnual} />
            <span
              className={`text-sm font-medium ${annual ? "text-foreground" : "text-muted-foreground"}`}
            >
              Annual{" "}
              <Badge variant="secondary" className="ml-1 text-xs">
                Save 2 months
              </Badge>
            </span>
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl gap-8 sm:grid-cols-2">
            {/* Free */}
            <Card className="flex flex-col border-border/60">
              <CardHeader>
                <CardTitle className="text-xl">Free</CardTitle>
                <p className="mt-2 text-4xl font-extrabold">
                  $0
                  <span className="text-base font-normal text-muted-foreground">
                    /mo
                  </span>
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="mb-8 flex-1 space-y-3 text-left text-sm">
                  {freeFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card className="relative flex flex-col border-primary shadow-glow">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge>Most Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-xl">Pro</CardTitle>
                <p className="mt-2 text-4xl font-extrabold">
                  ${proPrice}
                  <span className="text-base font-normal text-muted-foreground">
                    {proPeriod}
                  </span>
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="mb-8 flex-1 space-y-3 text-left text-sm">
                  {proFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" asChild>
                  <Link to="/auth">Start Free Trial</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social proof placeholder */}
      <section className="border-y border-border bg-muted/40 py-20 sm:py-28">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Trusted by Operators Nationwide
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border/60">
                <CardContent className="pt-6">
                  <div className="mb-3 flex justify-center gap-1">
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        className="h-4 w-4 fill-primary text-primary"
                      />
                    ))}
                  </div>
                  <p className="text-sm italic text-muted-foreground">
                    "ClawOps transformed how I manage my {i * 10}+ machines.
                    Revenue is up and headaches are down."
                  </p>
                  <p className="mt-4 text-sm font-semibold">
                    — Coming Soon
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4 text-center">
          <Shield className="mx-auto mb-6 h-10 w-10 text-primary" />
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Level Up Your Operation?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Join operators who are saving hours every week and growing revenue
            with ClawOps.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link to="/auth">
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} ClawOps. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
