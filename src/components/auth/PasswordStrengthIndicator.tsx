import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password?: string; // ✅ allow undefined
}

interface StrengthCriteria {
  label: string;
  test: (password: string) => boolean;
}

const criteria: StrengthCriteria[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "Contains uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "Contains lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "Contains number", test: (p) => /\d/.test(p) },
  {
    label: "Contains special character",
    test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p),
  },
];

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  // ✅ Normalize once
  const safePassword = password ?? "";

  const { score, results } = useMemo(() => {
    const results = criteria.map((c) => ({
      ...c,
      passed: c.test(safePassword),
    }));

    const score = results.filter((r) => r.passed).length;
    return { score, results };
  }, [safePassword]);

  if (!safePassword) return null; // ✅ render only when typing

  const getStrengthLabel = () => {
    if (score <= 2) return { label: "Weak", color: "text-destructive" };
    if (score === 3) return { label: "Fair", color: "text-warning" };
    if (score === 4) return { label: "Good", color: "text-primary" };
    return { label: "Strong", color: "text-success" };
  };

  const getBarColor = (index: number) => {
    if (index >= score) return "bg-muted";
    if (score <= 2) return "bg-destructive";
    if (score === 3) return "bg-warning";
    if (score === 4) return "bg-primary";
    return "bg-success";
  };

  const { label, color } = getStrengthLabel();

  return (
    <div className="space-y-3 mt-2">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={cn("font-medium", color)}>{label}</span>
        </div>

        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                getBarColor(index)
              )}
            />
          ))}
        </div>
      </div>

      {/* Criteria */}
      <ul className="space-y-1">
        {results.map((criterion) => (
          <li
            key={criterion.label}
            className={cn(
              "flex items-center gap-2 text-xs",
              criterion.passed
                ? "text-success"
                : "text-muted-foreground"
            )}
          >
            {criterion.passed ? (
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3" />
            )}
            {criterion.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
