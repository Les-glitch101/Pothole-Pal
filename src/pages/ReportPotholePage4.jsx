import { useNavigate } from "react-router-dom";
import FlowHeader from "../components/FlowHeader";
import {
  MapPinIcon,
  PencilIcon,
  AlertIcon,
  TrafficIcon,
  CarIcon,
  MessageIcon,
  CalendarIcon,
} from "../lib/icons";
import { useFlow } from "../context/flow";
import { POTHOLE_IMG } from "../lib/data";

function ReviewRow({ Icon, label, value, onEdit }) {
  return (
    <div className="flex items-center gap-3 border-b border-line py-3.5 last:border-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="truncate text-sm font-bold text-ink">{value}</p>
      </div>
      <button
        type="button"
        aria-label={`Edit ${label}`}
        onClick={onEdit}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary-soft"
      >
        <PencilIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function ReportPotholePage4() {
  const navigate = useNavigate();
  const { draft, submitDraft } = useFlow();

  const submit = () => {
    const report = submitDraft();
    navigate(`/report-details/${report.id}`, { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-white pb-8">
      <FlowHeader step={4} onBack={() => navigate("/report3")} />

      <div className="mt-5 px-5">
        <h2 className="text-lg font-extrabold">Review your report</h2>

        {/* Photo card */}
        <div className="mt-4 rounded-3xl border border-line bg-white p-3.5 shadow-sm">
          <img src={draft.photo || POTHOLE_IMG} alt="Reported pothole" className="h-44 w-full rounded-2xl object-cover" />
          <div className="mt-3 flex items-center justify-between">
            <span className="rounded-md bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary">
              {draft.issueType}
            </span>
            <button
              type="button"
              onClick={() => navigate("/report1")}
              className="text-xs font-bold text-primary"
            >
              Edit photo
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="mt-4 rounded-3xl border border-line bg-white px-3.5 shadow-sm">
          <ReviewRow
            Icon={MapPinIcon}
            label="Location"
            value={draft.address}
            onEdit={() => navigate("/report2")}
          />
          <ReviewRow
            Icon={AlertIcon}
            label="Issue details"
            value={`${draft.issueType} · ${draft.size} size · ${draft.depth} depth`}
            onEdit={() => navigate("/report3")}
          />
          <ReviewRow
            Icon={TrafficIcon}
            label="Traffic impact"
            value={draft.traffic}
            onEdit={() => navigate("/report3")}
          />
          <ReviewRow
            Icon={CarIcon}
            label="Vehicle damage"
            value={draft.damage}
            onEdit={() => navigate("/report3")}
          />
          <ReviewRow
            Icon={MessageIcon}
            label="Additional details"
            value={draft.description || "—"}
            onEdit={() => navigate("/report3")}
          />
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={submit}
          className="mt-6 w-full rounded-2xl bg-primary py-3.5 text-[15px] font-bold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary-dark"
        >
          Submit Report
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
          <CalendarIcon className="h-3.5 w-3.5" />
          Your report helps make our roads safer.
        </p>
      </div>
    </div>
  );
}

export default ReportPotholePage4;
