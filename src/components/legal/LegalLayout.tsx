import { ReactNode, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPANY, LEGAL_EFFECTIVE_DATE, LEGAL_LINKS, LEGAL_VERSION } from "@/config/legal";
import { LegalFooter } from "./LegalFooter";

interface LegalLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function LegalLayout({ title, description, children }: LegalLayoutProps) {
  useEffect(() => {
    document.title = `${title} | ClawOps`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", description);
  }, [title, description]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/sales" className="text-xl font-bold tracking-tight">
            <span className="text-primary">Claw</span>Ops
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/sales">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => window.print()}
            >
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {COMPANY.displayName} · Effective {LEGAL_EFFECTIVE_DATE} · Version {LEGAL_VERSION}
        </p>

        <div className="legal-prose mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
          {children}
        </div>

        <nav aria-label="Other legal documents" className="mt-12 border-t border-border pt-6">
          <h2 className="text-sm font-semibold">Other documents</h2>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {LEGAL_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-primary hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>

      <LegalFooter />
    </div>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
      {children}
    </section>
  );
}
