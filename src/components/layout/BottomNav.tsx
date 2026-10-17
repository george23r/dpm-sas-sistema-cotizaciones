import { NavLink } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { NAV_POR_ROL } from "@/components/layout/nav";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { rol } = useApp();
  const items = NAV_POR_ROL[rol];

  if (items.length <= 1) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface/95 backdrop-blur-sm md:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
              isActive ? "text-primary" : "text-muted",
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className={cn("size-5", isActive && "fill-soft")} />
              <span className="text-center leading-tight">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
