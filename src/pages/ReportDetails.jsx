import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, MapPinIcon, CalendarIcon, TrafficIcon, CarIcon, UserIcon, CheckIcon, XIcon } from "../lib/icons";
import { STATUS, STAGES, POTHOLE_IMG } from "../lib/data";
import { useFlow } from "../context/flow";
import { api } from "../lib/api";

const STAGE_BY_STATUS = { new: 0, review: 1, scheduled: 2, repairing: 3, fixed: 4 };

// The staff action on each status: what clicking "advance" does next.
const NEXT_STEP = {
  new: { status: "review", label: "Start review" },
  review: { status: "scheduled", label: "Schedule repair" },
  scheduled: { status: "repairing", label: "Start repair" },
  repairing: { status: "fixed", label: "Mark as fixed" },
};

function ReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { reports, resident, staff } = useFlow();
  const [following, setFollowing] = useState(false);
  const [fetched, setFetched] = useState(null);

  const inList = reports.find((r) => String(r.id) === String(id));

  // The staff portal opens this page straight from its queue, so if the list
  // in context has no match (different session), fetch the report directly.
  useEffect(() => {
    let alive = true;
    if (!inList && (resident || staff)) {
      api(`/reports/${id}`, { role: resident ? "resident" : "staff" })
        .then((r) => {
          if (alive) setFetched(r);
        })
        .catch(() => {
          if (alive) setFetched(null);
        });
    }
    return () => {
      alive = false;
    };
  }, [id, inList, resident, staff]);

  const report = inList || fetched;

  if (!report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
        <p className="text-sm font-semibold text-muted">Report #{id} could not be found.</p>
        <button
          type="button"
          onClick={() => navigate("/reports")}
          className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white"
        >
          Back to My Reports
        </button>
      </div>
    );
  }

  const status = STATUS[report.status];
  const stage = STAGE_BY_STATUS[report.status];

  return (
    <div className="flex min-h-screen flex-col bg-white pb-10">
      {/* Header */}
      <header className="relative flex h-14 items-center px-3">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-slate-100"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold">Report Details</h1>
      </header>

      {/* Status + ID */}
      <div className="flex items-center justify-between px-4">
        <span
          className="rounded-full px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider"
          style={{ background: status.bg, color: status.color }}
        >
          {status.label}
        </span>
        <span className="text-sm font-bold text-muted">ID: #{report.id}</span>
      </div>

      {/* Photo */}
      <div className="mt-4 px-4">
        <img
          src={report.photo || POTHOLE_IMG}
          alt="Reported pothole"
          className="h-52 w-full rounded-3xl border border-line object-cover shadow-sm"
        />
      </div>

      {/* Area + following */}
      <div className="mt-4 flex items-start gap-3 px-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold">{report.area}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
            <MapPinIcon className="h-4 w-4 shrink-0" /> {report.address}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFollowing((f) => !f)}
          className={`flex shrink-0 items-center gap-1 rounded-full border px-3.5 py-2 text-xs font-bold transition-colors ${
            following
              ? "border-primary bg-primary-soft text-primary"
              : "border-line bg-white text-slate-500 hover:border-slate-300"
          }`}
        >
          {following ? <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} /> : <XIcon className="h-3.5 w-3.5" strokeWidth={3} />}
          Following
        </button>
      </div>

      {/* Info grid */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        {[
          { label: "Severity", value: report.severityNote, Icon: TrafficIcon },
          { label: "Last Reported", value: report.reportedAt, Icon: CalendarIcon },
          { label: "Traffic Impact", value: report.traffic, Icon: TrafficIcon },
          { label: "Vehicle damage", value: report.damage, Icon: CarIcon },
        ].map(({ label, value, Icon }) => (
          <div key={label} className="rounded-2xl border border-line bg-white p-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-muted">
              <Icon className="h-4 w-4" />
              <span className="text-xs font-semibold">{label}</span>
            </div>
            <p className="mt-1.5 text-[15px] font-extrabold text-ink">{value}</p>
          </div>
        ))}
      </div>

      {/* Reporter */}
      <div className="mx-4 mt-3 flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-sm">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <UserIcon className="h-6 w-6" />
        </span>
        <div className="flex-1">
          <p className="text-xs text-muted">Reported by</p>
          <p className="text-sm font-bold">{report.reporter || "Unknown"}</p>
        </div>
        <span className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-700">
          {report.reporterTitle || "Newcomer"}
        </span>
      </div>

      {/* Progress timeline */}
      <div className="mx-4 mt-5 rounded-3xl border border-line bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-[15px] font-extrabold">Progress</h3>
        <ol className="relative">
          {STAGES.map((label, i) => {
            const done = i < stage;
            const current = i === stage;
            const date = report.timeline?.[i] || (i <= stage ? "In progress" : "Pending");
            return (
              <li key={label} className="relative flex gap-3 pb-5 last:pb-0">
                {i < STAGES.length - 1 && (
                  <span
                    className={`absolute left-[11px] top-6 h-full w-0.5 ${
                      i < stage ? "bg-emerald-400" : "bg-line"
                    }`}
                  />
                )}
                <span
                  className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : current
                        ? "border-primary bg-primary text-white"
                        : "border-line bg-white text-slate-300"
                  }`}
                >
                  {done ? (
                    <CheckIcon className="h-3.5 w-3.5" strokeWidth={3.5} />
                  ) : (
                    <span className={`h-2 w-2 rounded-full ${current ? "bg-white" : "bg-slate-300"}`} />
                  )}
                </span>
                <div className="-mt-0.5">
                  <p
                    className={`text-sm font-bold ${
                      done || current ? "text-ink" : "text-slate-400"
                    }`}
                  >
                    {label}
                  </p>
                  <p className="text-xs text-muted">{date}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Staff view (staff portal session): read-only. The progress is moved
          by the field teams from the Team Portal, the office only watches. */}
      {staff?.user?.role === "staff" && (
        <div className="mx-4 mt-4 rounded-3xl bg-navy p-4 text-white">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-extrabold">Report info</h3>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
              {report.priority}
            </span>
          </div>
          <p className="mt-1 text-xs text-white/60">
            Score {report.score} · {report.duplicateCount} duplicate
            {report.duplicateCount === 1 ? "" : "s"} reported
          </p>
          <p className="mt-3 rounded-2xl bg-white/10 px-3 py-2.5 text-center text-sm font-semibold text-white/70">
            {NEXT_STEP[report.status]
              ? "Progress is updated by the field team working on this report."
              : "Repair complete. This report is closed."}
          </p>
        </div>
      )}
    </div>
  );
}

export default ReportDetails;
