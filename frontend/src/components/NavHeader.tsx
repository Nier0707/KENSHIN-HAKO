import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function NavHeader({ title }: { title: string }) {
  const { employee, hasPermission, logout } = useAuth();
  const location = useLocation();

  const links = [
    { to: "/customers", label: "Customers", show: hasPermission("customer.manage") || hasPermission("customer.viewAllBranches") },
    { to: "/employees", label: "Employees", show: hasPermission("employee.manage") },
  ];

  return (
    <header className="bg-navy-950 text-paper">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-signal-500 uppercase">
            {employee?.role}
          </p>
          <h1 className="font-display font-bold text-lg tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-paper/60 text-sm">{employee?.fullName}</span>
          <button
            onClick={logout}
            className="font-mono text-[11px] uppercase tracking-wide border border-navy-700 rounded-sm px-3 py-1.5 hover:bg-navy-800"
          >
            Sign out
          </button>
        </div>
      </div>
      <nav className="px-6 flex gap-1 border-t border-navy-800">
        {links
          .filter((l) => l.show)
          .map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`font-mono text-[11px] uppercase tracking-wide px-3 py-2 border-b-2 transition-colors ${
                location.pathname === l.to
                  ? "border-signal-500 text-paper"
                  : "border-transparent text-paper/50 hover:text-paper/80"
              }`}
            >
              {l.label}
            </Link>
          ))}
      </nav>
    </header>
  );
}
