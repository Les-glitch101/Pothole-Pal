import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FlowHeader from "../components/FlowHeader";
import { CheckIcon, CameraIcon } from "../lib/icons";
import { useFlow } from "../context/flow";

/** Pill-style single-select group used for size / depth / traffic / damage. */
function ChipGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? "border-primary bg-primary-soft text-primary"
                : "border-line bg-white text-slate-500 hover:border-slate-300"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function FieldLabel({ children }) {
  return <p className="mb-2 text-sm font-bold text-ink">{children}</p>;
}

function ReportPotholePage3() {
  const navigate = useNavigate();
  const { draft, setDraft } = useFlow();
  const [issueType, setIssueType] = useState(draft.issueType);
  const [description, setDescription] = useState(draft.description);
  const [size, setSize] = useState(draft.size);
  const [depth, setDepth] = useState(draft.depth);
  const [traffic, setTraffic] = useState(draft.traffic);
  const [damage, setDamage] = useState(draft.damage);

  const next = () => {
    setDraft({ issueType, description, size, depth, traffic, damage });
    navigate("/report4");
  };

  return (
    <div className="flex min-h-screen flex-col bg-white pb-8">
      <FlowHeader step={3} onBack={() => navigate("/report2")} />

      <div className="mt-5 px-5">
        <h2 className="text-lg font-extrabold">Add details</h2>

        {/* Photo */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm">
          <img src={draft.photo} alt="Pothole" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Pothole photo</p>
            <p className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} /> Photo added successfully
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/report1")}
            className="flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-3 py-2 text-xs font-bold text-primary"
          >
            <CameraIcon className="h-4 w-4" /> Retake photo
          </button>
        </div>

        {/* Issue type */}
        <div className="mt-5">
          <FieldLabel>What type of road issue is this?</FieldLabel>
          <ChipGroup
            options={["Pothole", "Pothole and crack", "Damaged shoulder", "Other"]}
            value={issueType}
            onChange={setIssueType}
          />
        </div>

        {/* Description */}
        <div className="mt-5">
          <FieldLabel>Describe the issue</FieldLabel>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Large pothole, about 1 foot wide. Causes vehicles to swerve."
            className="w-full resize-none rounded-2xl border border-line bg-white p-3.5 text-sm outline-none placeholder:text-slate-400 focus:border-primary"
          />
        </div>

        {/* Size */}
        <div className="mt-5">
          <FieldLabel>Pothole size</FieldLabel>
          <ChipGroup options={["Small", "Medium", "Large"]} value={size} onChange={setSize} />
        </div>

        {/* Depth */}
        <div className="mt-5">
          <FieldLabel>Estimated depth</FieldLabel>
          <ChipGroup options={["Shallow", "Moderate", "Deep"]} value={depth} onChange={setDepth} />
        </div>

        {/* Traffic */}
        <div className="mt-5">
          <FieldLabel>Traffic impact</FieldLabel>
          <ChipGroup options={["Low", "Medium", "High"]} value={traffic} onChange={setTraffic} />
        </div>

        {/* Damage */}
        <div className="mt-5">
          <FieldLabel>Vehicle damage?</FieldLabel>
          <ChipGroup options={["No", "Yes"]} value={damage} onChange={setDamage} />
        </div>

        {/* Next */}
        <button
          type="button"
          onClick={next}
          className="mt-7 w-full rounded-2xl bg-primary py-3.5 text-[15px] font-bold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary-dark"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default ReportPotholePage3;
