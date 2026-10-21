import { useCallback, useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { FlowContext, EMPTY_DRAFT, useFlow } from "./context/flow";
import { api, getSession, setSession, clearSession, photoToBlob } from "./lib/api";

import Home from "./pages/Home";
import MapScreen from "./pages/Map";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import MyReports from "./pages/MyReports";
import ReportDetails from "./pages/ReportDetails";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ReportPotholePage1 from "./pages/ReportPotholePage1";
import ReportPotholePage2 from "./pages/ReportPotholePage2";
import ReportPotholePage3 from "./pages/ReportPotholePage3";
import ReportPotholePage4 from "./pages/ReportPotholePage4";

function RequireResident({ children }) {
  const { resident } = useFlow();
  if (!resident) return <Navigate to="/login" replace />;
  return children;
}

function RequireAnySession({ children }) {
  const { resident, staff } = useFlow();
  if (!resident && !staff) return <Navigate to="/login" replace />;
  return children;
}

function StaffGate() {
  const { staff } = useFlow();
  // No separate portal login any more: without a staff session this sends you
  // to the one sign-in page, which routes by role.
  return staff?.user?.role === "staff" ? <Dashboard /> : <Navigate to="/login" replace />;
}

function App() {
  const [draft, setDraftState] = useState(EMPTY_DRAFT);
  const [reports, setReports] = useState([]);
  const [resident, setResident] = useState(() => getSession("resident"));
  const [staff, setStaff] = useState(() => getSession("staff"));

  const setDraft = useCallback((patch) => {
    setDraftState((d) => ({ ...d, ...patch }));
  }, []);

  const refresh = useCallback(async () => {
    if (!resident && !staff) {
      setReports([]);
      return;
    }
    const role = resident ? "resident" : "staff";
    try {
      setReports(await api("/reports", { role }));
    } catch {
      // A 401 already redirected to the login screen; anything else leaves the
      // current list in place.
    }
  }, [resident, staff]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Keep both sides of the demo in sync without a manual reload: staff status
  // changes show up on the resident's screen within a few seconds.
  useEffect(() => {
    if (!resident && !staff) return undefined;
    const timer = setInterval(() => refresh(), 10000);
    return () => clearInterval(timer);
  }, [resident, staff, refresh]);

  const signIn = useCallback((role, session) => {
    setSession(role, session);
    if (role === "staff") setStaff(session);
    else setResident(session);
  }, []);

  const signOut = useCallback((role) => {
    api("/auth/logout", { method: "POST", role }).catch(() => {});
    clearSession(role);
    if (role === "staff") setStaff(null);
    else setResident(null);
  }, []);

  const submitDraft = useCallback(async () => {
    const form = new FormData();
    const photo = await photoToBlob(draft.photo);
    if (photo) form.append("photo", photo, "photo.jpg");
    for (const key of ["lat", "lng", "address", "issueType", "size", "depth", "traffic", "damage", "description"]) {
      form.append(key, draft[key] ?? "");
    }
    const created = await api("/reports", { method: "POST", form, role: "resident" });
    setDraftState(EMPTY_DRAFT);
    await refresh();
    return created;
  }, [draft, refresh]);

  const myReports = useMemo(() => reports.filter((r) => r.isMine), [reports]);

  const value = useMemo(
    () => ({
      draft,
      setDraft,
      reports,
      myReports,
      refresh,
      submitDraft,
      resident,
      staff,
      signIn,
      signOut,
    }),
    [draft, setDraft, reports, myReports, refresh, submitDraft, resident, staff, signIn, signOut],
  );

  return (
    <FlowContext.Provider value={value}>
      <div className="mx-auto min-h-screen w-full max-w-[430px] bg-white shadow-[0_0_40px_rgba(15,23,42,0.06)]">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/staff" element={<StaffGate />} />
          <Route path="/dashboard" element={<Navigate to="/staff" replace />} />
          <Route path="/" element={<RequireResident><Home /></RequireResident>} />
          <Route path="/map" element={<RequireResident><MapScreen /></RequireResident>} />
          <Route path="/profile" element={<RequireResident><Profile /></RequireResident>} />
          <Route path="/notifications" element={<RequireResident><Notifications /></RequireResident>} />
          <Route path="/reports" element={<RequireResident><MyReports /></RequireResident>} />
          <Route
            path="/report-details/:id"
            element={<RequireAnySession><ReportDetails /></RequireAnySession>}
          />
          <Route path="/report1" element={<RequireResident><ReportPotholePage1 /></RequireResident>} />
          <Route path="/report2" element={<RequireResident><ReportPotholePage2 /></RequireResident>} />
          <Route path="/report3" element={<RequireResident><ReportPotholePage3 /></RequireResident>} />
          <Route path="/report4" element={<RequireResident><ReportPotholePage4 /></RequireResident>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </FlowContext.Provider>
  );
}

export default App;
