import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { NavHeader } from "../components/NavHeader";

interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  role: { id: string; name: string };
  branch: { id: string; name: string } | null;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface Branch {
  id: string;
  name: string;
  country: string;
}

export function Employees() {
  const { employee: me, hasPermission, logout } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const canManage = hasPermission("employee.manage");

  useEffect(() => {
    Promise.all([
      api.get<Employee[]>("/employees"),
      api.get<Role[]>("/roles"),
      api.get<Branch[]>("/branches"),
    ])
      .then(([e, r, b]) => {
        setEmployees(e);
        setRoles(r);
        setBranches(b);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget; // capture now — e.currentTarget goes null after an await
    setError(null);
    const form = new FormData(formEl);
    try {
      const created = await api.post<Employee>("/employees", {
        fullName: form.get("fullName"),
        email: form.get("email"),
        phone: form.get("phone") || undefined,
        password: form.get("password"),
        roleId: form.get("roleId"),
        branchId: form.get("branchId") || undefined,
      });
      setEmployees((prev) => [created, ...prev]);
      setShowForm(false);
      formEl.reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create employee");
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm("Deactivate this employee? They will no longer be able to log in.")) return;
    try {
      const updated = await api.patch<Employee>(`/employees/${id}/deactivate`);
      setEmployees((prev) => prev.map((emp) => (emp.id === id ? updated : emp)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to deactivate");
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <NavHeader title="Employee Roster" />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <p className="text-signal-600 text-sm border border-signal-500/40 bg-signal-500/10 rounded-sm px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {canManage && (
          <div className="mb-6">
            <button
              onClick={() => setShowForm((s) => !s)}
              className="bg-signal-500 hover:bg-signal-600 text-navy-950 font-display font-bold text-sm tracking-wide px-4 py-2 rounded-sm transition-colors"
            >
              {showForm ? "Cancel" : "+ Add Employee"}
            </button>

            {showForm && (
              <form
                onSubmit={handleCreate}
                className="mt-4 border border-navy-700/20 bg-white rounded-sm p-5 grid grid-cols-2 gap-4"
              >
                <Field label="Full name" name="fullName" required />
                <Field label="Email" name="email" type="email" required />
                <Field label="Phone" name="phone" />
                <Field label="Temporary password" name="password" type="password" required />
                <div>
                  <label className="block font-mono text-[10px] tracking-[0.15em] text-navy-700/60 uppercase mb-1.5">
                    Role
                  </label>
                  <select
                    name="roleId"
                    required
                    className="w-full border border-navy-700/20 rounded-sm px-3 py-2 bg-white"
                  >
                    <option value="">Select role…</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] tracking-[0.15em] text-navy-700/60 uppercase mb-1.5">
                    Branch
                  </label>
                  <select
                    name="branchId"
                    className="w-full border border-navy-700/20 rounded-sm px-3 py-2 bg-white"
                  >
                    <option value="">No branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.country})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <button
                    type="submit"
                    className="bg-navy-950 hover:bg-navy-800 text-paper font-display font-bold text-sm tracking-wide px-4 py-2 rounded-sm transition-colors"
                  >
                    Create Employee
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {loading ? (
          <p className="text-navy-700/60">Loading roster…</p>
        ) : (
          <div className="border border-navy-700/15 rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy-950 text-paper/70 font-mono text-[10px] uppercase tracking-[0.1em]">
                  <th className="text-left px-4 py-2.5">Name</th>
                  <th className="text-left px-4 py-2.5">Email</th>
                  <th className="text-left px-4 py-2.5">Role</th>
                  <th className="text-left px-4 py-2.5">Branch</th>
                  <th className="text-left px-4 py-2.5">Status</th>
                  {canManage && <th className="px-4 py-2.5"></th>}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, i) => (
                  <tr
                    key={emp.id}
                    className={i % 2 === 0 ? "bg-white" : "bg-navy-950/[0.02]"}
                  >
                    <td className="px-4 py-2.5 font-medium">{emp.fullName}</td>
                    <td className="px-4 py-2.5 text-navy-700/70">{emp.email}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-[11px] uppercase tracking-wide bg-navy-950/5 px-2 py-0.5 rounded-sm">
                        {emp.role.name}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-navy-700/70">
                      {emp.branch?.name ?? "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {emp.isActive ? (
                        <span className="text-green-700 text-xs font-medium">Active</span>
                      ) : (
                        <span className="text-navy-700/40 text-xs font-medium">Inactive</span>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-4 py-2.5 text-right">
                        {emp.isActive && emp.id !== me?.id && (
                          <button
                            onClick={() => handleDeactivate(emp.id)}
                            className="text-signal-600 text-xs font-mono uppercase tracking-wide hover:underline"
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block font-mono text-[10px] tracking-[0.15em] text-navy-700/60 uppercase mb-1.5">
        {label}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full border border-navy-700/20 rounded-sm px-3 py-2"
      />
    </div>
  );
}
