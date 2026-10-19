import { useCallback, useMemo, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { FlowContext, EMPTY_DRAFT } from "./context/flow";
import { SEED_REPORTS, POTHOLE_IMG } from "./lib/data";

import Home from "./pages/Home";
import MapScreen from "./pages/Map";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import MyReports from "./pages/MyReports";
import ReportDetails from "./pages/ReportDetails";
import Dashboard from "./pages/Dashboard";
import ReportPotholePage1 from "./pages/ReportPotholePage1";
import ReportPotholePage2 from "./pages/ReportPotholePage2";
import ReportPotholePage3 from "./pages/ReportPotholePage3";
import ReportPotholePage4 from "./pages/ReportPotholePage4";

const SEVERITY_BY_SIZE = { Small: "Low", Medium: "Medium", Large: "High" };
const NOTE_BY_SIZE = { Small: "Low", Medium: "Medium", Large: "Severe" };

function nearestAreaOf(lat, lng) {
  let best = null;
  let bestDist = Infinity;
  for (const r of SEED_REPORTS) {
    const d = (r.lat - lat) ** 2 + (r.lng - lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = r;
    }
  }
  return best;
}

function App() {
  const [draft, setDraftState] = useState(EMPTY_DRAFT);
  const [myReports, setMyReports] = useState([]);

  const setDraft = useCallback((patch) => {
    setDraftState((d) => ({ ...d, ...patch }));
  }, []);

  const submitDraft = useCallback(() => {
    const id = 1025 + myReports.length;
    const near = nearestAreaOf(draft.lat, draft.lng);
    const report = {
      ...draft,
      id,
      area: near ? near.area : "Vereeniging",
      photo: draft.photo || POTHOLE_IMG,
      severity: SEVERITY_BY_SIZE[draft.size] || "Medium",
      severityNote: NOTE_BY_SIZE[draft.size] || "Medium",
      status: "new",
      reportedAt: "Just now",
      isMine: true,
      timeline: ["Just now", "", "", "", ""],
    };
    setMyReports((list) => [report, ...list]);
    setDraftState(EMPTY_DRAFT);
    return report;
  }, [draft, myReports.length]);

  const value = useMemo(
    () => ({ draft, setDraft, myReports, submitDraft }),
    [draft, setDraft, myReports, submitDraft],
  );

  return (
    <FlowContext.Provider value={value}>
      <div className="mx-auto min-h-screen w-full max-w-[430px] bg-white shadow-[0_0_40px_rgba(15,23,42,0.06)]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapScreen />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/reports" element={<MyReports />} />
          <Route path="/report-details/:id" element={<ReportDetails />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/report1" element={<ReportPotholePage1 />} />
          <Route path="/report2" element={<ReportPotholePage2 />} />
          <Route path="/report3" element={<ReportPotholePage3 />} />
          <Route path="/report4" element={<ReportPotholePage4 />} />
        </Routes>
      </div>
    </FlowContext.Provider>
  );
}

export default App;
