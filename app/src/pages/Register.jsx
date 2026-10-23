import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useFlow } from "../context/flow";
import { api } from "../lib/api";
import { EyeIcon, EyeOffIcon } from "../lib/icons";

/** Resident sign-up. The server forces the resident role and rejects the
 *  reserved staff email domain, so this page cannot create portal access. */
function Register() {
  const { resident, staff, signIn } = useFlow();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (resident) return <Navigate to="/" replace />;
  if (staff) return <Navigate to="/staff" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const session = await api("/auth/register", {
        method: "POST",
        body: { name, email, password },
        noRedirect: true,
      });
      signIn("resident", session);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white px-6 pt-14">
      <div className="flex flex-col items-center">
        <img src="/logo-96.png" alt="" className="h-14 w-14 object-contain" />
        <h1 className="mt-4 text-2xl font-extrabold">Create your account</h1>
        <p className="mt-1 text-sm text-muted">Report potholes and track the repairs</p>
      </div>

      <form onSubmit={submit} className="mt-7">
        <label className="block text-xs font-bold text-muted" htmlFor="name">
          Full name
        </label>
        <input
          id="name"
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="mt-1.5 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-primary"
        />

        <label className="mt-4 block text-xs font-bold text-muted" htmlFor="reg-email">
          Email
        </label>
        <input
          id="reg-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1.5 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-primary"
        />

        <label className="mt-4 block text-xs font-bold text-muted" htmlFor="reg-password">
          Password
        </label>
        <div className="relative mt-1.5">
          <input
            id="reg-password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full rounded-2xl border border-line px-4 py-3 pr-11 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-ink"
          >
            {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        </div>

        <label className="mt-4 block text-xs font-bold text-muted" htmlFor="reg-confirm">
          Confirm password
        </label>
        <div className="relative mt-1.5">
          <input
            id="reg-confirm"
            type={showConfirm ? "text" : "password"}
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Type it again"
            className="w-full rounded-2xl border border-line px-4 py-3 pr-11 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((s) => !s)}
            aria-label={showConfirm ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-ink"
          >
            {showConfirm ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-2xl bg-primary py-3.5 text-[15px] font-bold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {busy ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Already registered?{" "}
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="font-bold text-primary hover:underline"
        >
          Sign in
        </button>
      </p>

      <p className="mt-4 text-center text-xs leading-relaxed text-muted">
        Municipal staff accounts are issued by the municipality and cannot be
        created here.
      </p>

      <div className="pb-8" />
    </div>
  );
}

export default Register;
