import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LegalFooter } from "./LegalFooter";
import { LEGAL_EFFECTIVE_DATE, LEGAL_VERSION } from "@/config/legal";

interface LegalLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  showVersion?: boolean;
}

export function LegalLayout({ title, description, children, showVersion = true }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to ClawOps
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
        {showVersion && (
          <p className="text-xs text-muted-foreground mt-2">
            Effective {LEGAL_EFFECTIVE_DATE} · Version {LEGAL_VERSION}
          </p>
        )}

        <div className="legal-prose mt-8 space-y-6 text-sm leading-relaxed text-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_table]:w-full [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top [&_th]:text-left [&_th]:py-2 [&_th]:pr-4">
          {children}
        </div>

        <LegalFooter />
      </div>
    </div>
  );
}
