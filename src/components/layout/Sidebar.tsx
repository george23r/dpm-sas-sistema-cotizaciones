import { NavLink } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { NAV_POR_ROL } from "@/components/layout/nav";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { rol } = useApp();
  const items = NAV_POR_ROL[rol];

  return (
    <aside className="hidden w-64 shrink-0 border-r border-line bg-surface md:flex md:flex-col">
      <nav className="flex flex-col gap-1 p-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-[var(--radius-btn)] px-3.5 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-soft text-primary"
                  : "text-muted hover:bg-app-bg hover:text-ink",
              )
            }
          >
            <item.icon className="size-4.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
