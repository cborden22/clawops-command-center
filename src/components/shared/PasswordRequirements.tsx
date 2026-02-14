import { Check, Circle } from "lucide-react";

interface PasswordRequirementsProps {
  password: string;
}

const requirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "1 uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "1 lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "1 number", test: (p: string) => /[0-9]/.test(p) },
  { label: "1 special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function PasswordRequirements({ password }: PasswordRequirementsProps) {
  return (
    <ul className="space-y-1 text-xs">
      {requirements.map((req) => {
        const met = password.length > 0 && req.test(password);
        return (
          <li key={req.label} className="flex items-center gap-1.5">
            {met ? (
              <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            )}
            <span className={met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
              {req.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
