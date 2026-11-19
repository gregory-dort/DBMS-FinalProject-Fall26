import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { UserPicker } from "./UserPicker";

const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/products", label: "Products" },
  { to: "/inventory", label: "Inventory" },
  { to: "/suppliers", label: "Suppliers" },
  { to: "/transactions", label: "Transactions" },
  { to: "/data-issues", label: "Data issues" },
];

// OWNER: Greg — placeholder shell; restyle freely.
export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      <aside className="w-56 border-r bg-white p-4">
        <h1 className="mb-6 text-lg font-semibold">Grocery Inventory</h1>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn("rounded px-3 py-2 text-sm hover:bg-neutral-100", isActive && "bg-neutral-100 font-medium")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex justify-end border-b bg-white px-6 py-3">
          <UserPicker />
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
