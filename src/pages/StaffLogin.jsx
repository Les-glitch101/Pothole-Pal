import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFlow } from "../context/flow";
import { api } from "../lib/api";

function StaffLogin() {
  const { signIn } = useFlow();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = await api("/auth/login", {
        method: "POST",
        body: { email, password },
        role: "staff",
      });
      if (session.user.role !== "staff") {
        setError("That is a resident account. Sign in through the resident app instead.");
        return;
      }
      signIn("staff", session);
      navigate("/staff", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-navy px-6 pt-20 text-white">
      <div className="flex flex-col items-center">
        <img src="/logo-96.png" alt="" className="h-14 w-14 object-contain" />
        <h1 className="mt-4 text-2xl font-extrabold">Municipality Portal</h1>
        <p className="mt-1 text-sm text-white/60">Staff access only</p>
      </div>

      <form onSubmit={submit} className="mt-8">
        <label className="block text-xs font-bold text-white/60" htmlFor="staff-email">
          Work email
        </label>
        <input
          id="staff-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@mun.gov.za"
          className="mt-1.5 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-primary"
        />

        <label className="mt-5 block text-xs font-bold text-white/60" htmlFor="staff-password">
          Password
        </label>
        <input
          id="staff-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          className="mt-1.5 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-primary"
        />

        {error && (
          <p className="mt-4 rounded-xl bg-red-500/15 px-3 py-2.5 text-sm font-semibold text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-2xl bg-primary py-3.5 text-[15px] font-bold text-white shadow-lg shadow-primary/30 transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {busy ? "Signing in..." : "Sign in to portal"}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-white/60">
        <p className="font-bold text-white">Demo staff account</p>
        <p className="mt-1 font-mono">staff@potholepal.test / staff123</p>
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-3 font-bold text-primary-soft hover:underline"
        >
          Resident? Sign in through the app
        </button>
      </div>
    </div>
  );
}

export default StaffLogin;
