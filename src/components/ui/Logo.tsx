import { cn } from "@/lib/utils";

/**
 * FinSight brand mark — a single glossy "F" inside a rounded gradient tile.
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
        "relative flex flex-shrink-0 items-center justify-center rounded-[28%] bg-gradient-to-br from-[#0a84ff] to-[#bf5af2] shadow-[0_6px_18px_rgba(10,132,255,0.5),inset_0_1px_0_rgba(255,255,255,0.45)]",
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
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
