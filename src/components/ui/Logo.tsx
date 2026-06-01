import { cn } from "@/lib/utils";

/**
 * FinSight brand mark — a single "F" inside a rounded glass tile that follows
 * the active theme (no fixed colour accent).
 */
export default function Logo({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-shrink-0 items-center justify-center rounded-[28%] border border-[color:var(--btn-glass-border)] bg-[var(--btn-glass-bg)] text-ink shadow-[inset_0_1px_0_var(--btn-glass-highlight)] backdrop-blur-xl",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        width={size * 0.62}
        height={size * 0.62}
        fill="none"
      >
        <path
          d="M8 5.5h9M8 5.5v13M8 11.8h7"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
