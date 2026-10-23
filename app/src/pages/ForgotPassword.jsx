import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useFlow } from "../context/flow";
import { api } from "../lib/api";
import { EyeIcon, EyeOffIcon } from "../lib/icons";

/**
 * Two-step password reset: request a code, then enter it with a new password.
 * The demo has no mail service, so the server hands the code back in the
 * response and the page shows it in a clearly labelled panel (a real
 * deployment would email it). The code is single use and lasts 15 minutes.
 * Works for resident and staff accounts; on success the user is signed in and
 * sent to the right side.
 */
function ForgotPassword() {
  const { resident, staff, signIn } = useFlow();
  const navigate = useNavigate();
  const [stage, setStage] = useState("email");
  const [email, setEmail] = useState("");
  const [demoCode, setDemoCode] = useState(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (resident) return <Navigate to="/" replace />;
  if (staff) return <Navigate to="/staff" replace />;

  const requestCode = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const data = await api("/auth/forgot", {
        method: "POST",
        body: { email },
        noRedirect: true,
      });
      setDemoCode(data.demoCode);
      setStage("code");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (e) => {
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
      const session = await api("/auth/reset", {
        method: "POST",
        body: { email, code, password },
        noRedirect: true,
      });
      const isStaff = session.user.role === "staff";
      signIn(isStaff ? "staff" : "resident", session);
      navigate(isStaff ? "/staff" : "/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white px-6 pt-16">
      <div className="flex flex-col items-center">
        <img src="/logo-96.png" alt="" className="h-14 w-14 object-contain" />
        <h1 className="mt-4 text-2xl font-extrabold">Reset your password</h1>
        <p className="mt-1 text-sm text-muted">
          {stage === "email"
            ? "Enter your email and we will send a reset code"
            : "Enter the code and choose a new password"}
        </p>
      </div>

      {stage === "email" ? (
        <form onSubmit={requestCode} className="mt-8">
          <label className="block text-xs font-bold text-muted" htmlFor="forgot-email">
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1.5 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-primary"
          />

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
            {busy ? "Sending code..." : "Send reset code"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="mt-8">
          {demoCode && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-900">
              <p className="font-extrabold">Demo mode: no email service is connected</p>
              <p className="mt-1">
                In production this code would arrive by email. Here it is:{" "}
                <span className="font-mono text-sm font-bold tracking-widest">{demoCode}</span>
                {" "}Valid for 15 minutes, and it can be used once.
              </p>
            </div>
          )}

          <label className="mt-5 block text-xs font-bold text-muted" htmlFor="reset-code">
            Reset code
          </label>
          <input
            id="reset-code"
            type="text"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="6 digits"
            className="mt-1.5 w-full rounded-2xl border border-line px-4 py-3 text-center font-mono text-base tracking-[0.4em] outline-none focus:border-primary"
          />

          <label className="mt-4 block text-xs font-bold text-muted" htmlFor="reset-password">
            New password
          </label>
          <div className="relative mt-1.5">
            <input
              id="reset-password"
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

          <label className="mt-4 block text-xs font-bold text-muted" htmlFor="reset-confirm">
            Confirm new password
          </label>
          <div className="relative mt-1.5">
            <input
              id="reset-confirm"
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
            {busy ? "Setting password..." : "Set new password and sign in"}
          </button>

          <div className="mt-4 flex items-center justify-between text-xs font-semibold text-muted">
            <button
              type="button"
              onClick={() => requestCode(null)}
              disabled={busy}
              className="text-primary hover:underline disabled:opacity-60"
            >
              Send a new code
            </button>
            <span>Email: {email}</span>
          </div>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="font-bold text-primary hover:underline"
        >
          Back to sign in
        </button>
      </p>

      <div className="pb-8" />
    </div>
  );
}

export default ForgotPassword;
