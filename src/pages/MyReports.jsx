import { useNavigate } from "react-router-dom";
import NavBar from "../components/navbar";
import { ChevronLeft, ChevronRight, PlusIcon } from "../lib/icons";
import { SEED_REPORTS, STATUS } from "../lib/data";
import { useFlow } from "../context/flow";

function MyReports() {
  const navigate = useNavigate();
  const { myReports } = useFlow();

  const list = [...myReports, ...SEED_REPORTS.filter((r) => r.isMine)];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="relative flex h-14 items-center px-3">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => navigate("/profile")}
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-slate-100"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold">My Reports</h1>
      </header>

      <div className="flex-1 px-4 pb-28">
        {list.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <p className="text-sm font-semibold text-muted">You haven't submitted a report yet.</p>
            <button
              type="button"
              onClick={() => navigate("/report1")}
              className="mt-4 flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25"
            >
              <PlusIcon className="h-4 w-4" strokeWidth={2.6} /> Report a Pothole
            </button>
          </div>
        ) : (
          <ul className="mt-2 space-y-2.5">
            {list.map((r) => {
              const status = STATUS[r.status];
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/report-details/${r.id}`)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-3 text-left shadow-sm transition-colors hover:bg-slate-50"
                  >
                    <img src={r.photo} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold">
                        {r.area}
                        <span className="ml-2 text-xs font-semibold text-muted">#{r.id}</span>
                      </p>
                      <p className="truncate text-xs text-muted">{r.address}</p>
                      <span
                        className="mt-1.5 inline-block rounded-md px-2 py-0.5 text-[11px] font-bold"
                        style={{ background: status.bg, color: status.color }}
                      >
                        {status.label}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <NavBar />
    </div>
  );
}

export default MyReports;
