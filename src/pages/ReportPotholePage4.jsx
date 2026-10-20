import { useState } from "react";
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
import { api, photoToBlob } from "../lib/api";

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
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [duplicateRef, setDuplicateRef] = useState(null);
  const [evidenceDone, setEvidenceDone] = useState(false);

  const submit = async () => {
    setBusy(true);
    setSubmitError(null);
    setDuplicateRef(null);
    setEvidenceDone(false);
    try {
      const report = await submitDraft();
      navigate(`/report-details/${report.id}`, { replace: true });
    } catch (err) {
      setSubmitError(err.message || "Could not submit the report. Is the server running?");
      if (err.code === "duplicate_report") setDuplicateRef(err.ref);
    } finally {
      setBusy(false);
    }
  };

  const attachEvidence = async () => {
    if (!duplicateRef) return;
    setBusy(true);
    try {
      const form = new FormData();
      const photo = await photoToBlob(draft.photo);
      if (photo) form.append("photo", photo, "photo.jpg");
      await api(`/reports/${duplicateRef.replace("#", "")}/evidence`, {
        method: "POST",
        form,
        role: "resident",
      });
      setEvidenceDone(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setBusy(false);
    }
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

        {/* Duplicate warning (FR-03) and evidence attach */}
        {submitError && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm">
            <p className="font-bold text-red-600">{submitError}</p>
            {duplicateRef && !evidenceDone && (
              <button
                type="button"
                onClick={attachEvidence}
                disabled={busy}
                className="mt-2 font-bold text-primary hover:underline disabled:opacity-60"
              >
                Add my photo as supporting evidence
              </button>
            )}
            {evidenceDone && (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="font-semibold text-emerald-600">
                  Photo attached to {duplicateRef}.
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/report-details/${duplicateRef.replace("#", "")}`)}
                  className="font-bold text-primary hover:underline"
                >
                  View report
                </button>
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="mt-6 w-full rounded-2xl bg-primary py-3.5 text-[15px] font-bold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {busy ? "Submitting..." : "Submit Report"}
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
