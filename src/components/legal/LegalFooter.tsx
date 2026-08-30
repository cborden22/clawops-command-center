import { Link } from "react-router-dom";
import { COMPANY, LEGAL_LINKS } from "@/config/legal";

export function LegalFooter() {
  return (
    <footer className="border-t border-border py-8">
      <div className="container mx-auto space-y-4 px-4 text-center text-sm text-muted-foreground">
        <nav aria-label="Legal">
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <a href={`mailto:${COMPANY.supportEmail}`} className="hover:text-foreground">
                Contact
              </a>
            </li>
          </ul>
        </nav>
        <p>
          © {new Date().getFullYear()} {COMPANY.displayName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
