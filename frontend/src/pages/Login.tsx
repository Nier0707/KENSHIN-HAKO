import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/customers");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Signature element: a manifest-stamp header, evoking a cargo
            waybill rather than a generic SaaS login card. */}
        <div className="border border-navy-700 bg-navy-900 rounded-sm overflow-hidden">
          <div className="border-b border-navy-700 px-6 py-5 flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-signal-500 uppercase">
                Staff Access
              </p>
              <h1 className="font-display font-bold text-xl text-paper tracking-tight">
                KENSHIN HAKO
              </h1>
            </div>
            <div className="font-mono text-[10px] text-navy-700 border border-navy-700 rounded-full w-9 h-9 flex items-center justify-center text-paper/60">
              KH
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            <div>
              <label className="block font-mono text-[10px] tracking-[0.15em] text-paper/50 uppercase mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-sm px-3 py-2 text-paper placeholder:text-paper/30 focus:outline-none focus:ring-2 focus:ring-signal-500 focus:border-transparent"
                placeholder="you@kenshinhako.com"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] tracking-[0.15em] text-paper/50 uppercase mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-sm px-3 py-2 text-paper placeholder:text-paper/30 focus:outline-none focus:ring-2 focus:ring-signal-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-signal-500 text-sm border border-signal-600/40 bg-signal-600/10 rounded-sm px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-signal-500 hover:bg-signal-600 disabled:opacity-50 text-navy-950 font-display font-bold tracking-wide py-2.5 rounded-sm transition-colors"
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-paper/30 text-xs mt-4 font-mono">
          Internal staff portal — not for customer use
        </p>
      </div>
    </div>
  );
}
