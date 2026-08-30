import { Link } from "react-router-dom";
import { COMPANY, LEGAL_LINKS } from "@/config/legal";

export function LegalFooter() {
  return (
    <footer className="border-t border-border mt-12 pt-6 pb-10 text-sm text-muted-foreground">
      <nav className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
        {LEGAL_LINKS.map((link) => (
          <Link key={link.href} to={link.href} className="hover:text-foreground transition-colors">
            {link.label}
          </Link>
        ))}
      </nav>
      <p>
        {COMPANY.displayName} · {COMPANY.addressLine}
      </p>
      <p>
        <a href={`mailto:${COMPANY.supportEmail}`} className="hover:text-foreground transition-colors">
          {COMPANY.supportEmail}
        </a>
      </p>
      <p className="mt-2">© {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.</p>
    </footer>
  );
}
