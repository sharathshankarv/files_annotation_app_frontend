import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md",
        className,
      )}
    >
      {children}
    </div>
  );
}
