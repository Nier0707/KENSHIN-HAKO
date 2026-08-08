import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { NavHeader } from "../components/NavHeader";

interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  originCountry: string | null;
  preferredContactChannel: string | null;
  createdAt: string;
  branch: { id: string; name: string; country: string };
  _count: { senders: number; receivers: number };
}

interface CustomerDetail extends Customer {
  senders: { id: string; fullName: string; phone: string; addressAbroad: string }[];
  receivers: { id: string; fullName: string; phone: string; addressPh: string; region: string | null }[];
}

interface Branch {
  id: string;
  name: string;
  country: string;
}

export function Customers() {
  const { hasPermission } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const canManage = hasPermission("customer.manage");
  const viewAllBranches = hasPermission("customer.viewAllBranches");

  useEffect(() => {
    loadCustomers();
    if (viewAllBranches) {
      api.get<Branch[]>("/branches").then(setBranches).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadCustomers(q?: string) {
    setLoading(true);
    api
      .get<Customer[]>(`/customers${q ? `?search=${encodeURIComponent(q)}` : ""}`)
      .then(setCustomers)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    loadCustomers(search);
  }

  async function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    try {
      const full = await api.get<CustomerDetail>(`/customers/${id}`);
      setDetail(full);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load customer");
    }
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (creating) return; // ignore a second click while the first request is in flight
    const formEl = e.currentTarget; // capture now — e.currentTarget goes null after an await
    setCreating(true);
    setError(null);
    const form = new FormData(formEl);
    try {
      const created = await api.post<Customer>("/customers", {
        fullName: form.get("fullName"),
        phone: form.get("phone"),
        email: form.get("email") || undefined,
        address: form.get("address") || undefined,
        originCountry: form.get("originCountry") || undefined,
        preferredContactChannel: form.get("preferredContactChannel") || undefined,
        branchId: form.get("branchId") || undefined,
      });
      setCustomers((prev) => [created, ...prev]);
      setShowForm(false);
      formEl.reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create customer");
    } finally {
      setCreating(false);
    }
  }

  async function handleAddSender(customerId: string, e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    try {
      await api.post(`/customers/${customerId}/senders`, {
        fullName: form.get("fullName"),
        phone: form.get("phone"),
        addressAbroad: form.get("addressAbroad"),
      });
      const full = await api.get<CustomerDetail>(`/customers/${customerId}`);
      setDetail(full);
      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, _count: { ...c._count, senders: c._count.senders + 1 } } : c))
      );
      formEl.reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add sender");
    }
  }

  async function handleAddReceiver(customerId: string, e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    try {
      await api.post(`/customers/${customerId}/receivers`, {
        fullName: form.get("fullName"),
        phone: form.get("phone"),
        addressPh: form.get("addressPh"),
        region: form.get("region") || undefined,
      });
      const full = await api.get<CustomerDetail>(`/customers/${customerId}`);
      setDetail(full);
      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, _count: { ...c._count, receivers: c._count.receivers + 1 } } : c))
      );
      formEl.reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add receiver");
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <NavHeader title="Customers" />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <p className="text-signal-600 text-sm border border-signal-500/40 bg-signal-500/10 rounded-sm px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-sm">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, or email…"
              className="flex-1 border border-navy-700/20 rounded-sm px-3 py-2 bg-white text-sm"
            />
            <button
              type="submit"
              className="font-mono text-[11px] uppercase tracking-wide border border-navy-700/30 rounded-sm px-3 py-2 hover:bg-navy-950/5"
            >
              Search
            </button>
          </form>

          {canManage && (
            <button
              onClick={() => setShowForm((s) => !s)}
              className="bg-signal-500 hover:bg-signal-600 text-navy-950 font-display font-bold text-sm tracking-wide px-4 py-2 rounded-sm transition-colors whitespace-nowrap"
            >
              {showForm ? "Cancel" : "+ Add Customer"}
            </button>
          )}
        </div>

        {showForm && canManage && (
          <form
            onSubmit={handleCreate}
            className="mb-6 border border-navy-700/20 bg-white rounded-sm p-5 grid grid-cols-2 gap-4"
          >
            <Field label="Full name" name="fullName" required />
            <Field label="Phone" name="phone" required />
            <Field label="Email" name="email" type="email" />
            <Field label="Origin country" name="originCountry" />
            <Field label="Address" name="address" />
            <div>
              <label className="block font-mono text-[10px] tracking-[0.15em] text-navy-700/60 uppercase mb-1.5">
                Preferred contact
              </label>
              <select
                name="preferredContactChannel"
                className="w-full border border-navy-700/20 rounded-sm px-3 py-2 bg-white"
              >
                <option value="">—</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="messenger">Messenger</option>
              </select>
            </div>
            {viewAllBranches && (
              <div>
                <label className="block font-mono text-[10px] tracking-[0.15em] text-navy-700/60 uppercase mb-1.5">
                  Branch
                </label>
                <select
                  name="branchId"
                  required
                  className="w-full border border-navy-700/20 rounded-sm px-3 py-2 bg-white"
                >
                  <option value="">Select branch…</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.country})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="col-span-2">
              <button
                type="submit"
                disabled={creating}
                className="bg-navy-950 hover:bg-navy-800 disabled:opacity-50 text-paper font-display font-bold text-sm tracking-wide px-4 py-2 rounded-sm transition-colors"
              >
                {creating ? "Creating…" : "Create Customer"}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-navy-700/60">Loading customers…</p>
        ) : customers.length === 0 ? (
          <p className="text-navy-700/50 text-sm">No customers yet.</p>
        ) : (
          <div className="space-y-2">
            {customers.map((c) => (
              <div key={c.id} className="border border-navy-700/15 rounded-sm bg-white">
                <button
                  onClick={() => toggleExpand(c.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-navy-950/[0.02]"
                >
                  <div>
                    <p className="font-medium text-sm">{c.fullName}</p>
                    <p className="text-navy-700/60 text-xs">
                      {c.phone} · {c.branch.name} · {c._count.senders} sender(s), {c._count.receivers} receiver(s)
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-navy-700/40 uppercase">
                    {expandedId === c.id ? "Hide" : "View"}
                  </span>
                </button>

                {expandedId === c.id && detail && detail.id === c.id && (
                  <div className="border-t border-navy-700/10 px-4 py-4 grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-navy-700/50 mb-2">
                        Senders
                      </h3>
                      <ul className="space-y-1 mb-3">
                        {detail.senders.length === 0 && (
                          <li className="text-navy-700/40 text-xs">None yet</li>
                        )}
                        {detail.senders.map((s) => (
                          <li key={s.id} className="text-sm">
                            {s.fullName} — <span className="text-navy-700/60">{s.phone}</span>
                          </li>
                        ))}
                      </ul>
                      {canManage && (
                        <form
                          onSubmit={(e) => handleAddSender(c.id, e)}
                          className="space-y-2 border-t border-navy-700/10 pt-3"
                        >
                          <input name="fullName" required placeholder="Sender name" className="w-full border border-navy-700/20 rounded-sm px-2 py-1.5 text-sm" />
                          <input name="phone" required placeholder="Phone" className="w-full border border-navy-700/20 rounded-sm px-2 py-1.5 text-sm" />
                          <input name="addressAbroad" required placeholder="Address abroad" className="w-full border border-navy-700/20 rounded-sm px-2 py-1.5 text-sm" />
                          <button type="submit" className="font-mono text-[10px] uppercase tracking-wide bg-navy-950 text-paper px-3 py-1.5 rounded-sm">
                            + Add sender
                          </button>
                        </form>
                      )}
                    </div>

                    <div>
                      <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-navy-700/50 mb-2">
                        Receivers
                      </h3>
                      <ul className="space-y-1 mb-3">
                        {detail.receivers.length === 0 && (
                          <li className="text-navy-700/40 text-xs">None yet</li>
                        )}
                        {detail.receivers.map((r) => (
                          <li key={r.id} className="text-sm">
                            {r.fullName} — <span className="text-navy-700/60">{r.phone}</span>
                          </li>
                        ))}
                      </ul>
                      {canManage && (
                        <form
                          onSubmit={(e) => handleAddReceiver(c.id, e)}
                          className="space-y-2 border-t border-navy-700/10 pt-3"
                        >
                          <input name="fullName" required placeholder="Receiver name" className="w-full border border-navy-700/20 rounded-sm px-2 py-1.5 text-sm" />
                          <input name="phone" required placeholder="Phone" className="w-full border border-navy-700/20 rounded-sm px-2 py-1.5 text-sm" />
                          <input name="addressPh" required placeholder="Address in PH" className="w-full border border-navy-700/20 rounded-sm px-2 py-1.5 text-sm" />
                          <input name="region" placeholder="Region (optional)" className="w-full border border-navy-700/20 rounded-sm px-2 py-1.5 text-sm" />
                          <button type="submit" className="font-mono text-[10px] uppercase tracking-wide bg-navy-950 text-paper px-3 py-1.5 rounded-sm">
                            + Add receiver
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
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
