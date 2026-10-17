import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

export function HuTag({ id, className }: { id: string; className?: string }) {
  const { mostrarHU } = useApp();
  if (!mostrarHU) return null;

  return (
    <span
      className={cn(
        "pointer-events-none fixed bottom-20 right-4 z-50 rounded-full border border-line bg-surface/90 px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted shadow-sm backdrop-blur-sm md:bottom-4",
        className,
      )}
    >
      {id}
    </span>
  );
}
