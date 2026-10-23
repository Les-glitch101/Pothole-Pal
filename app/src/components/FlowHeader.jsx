import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "../lib/icons";
import PageIndicator from "./pageIndicator";

/**
 * Shared chrome for all four report-flow screens:
 * back chevron + centered title, "n of 4" caption, segmented progress bar.
 */
function FlowHeader({ step, title = "Report a Pothole", onBack }) {
  const navigate = useNavigate();

  return (
    <div className="px-5 pt-4">
      <div className="relative flex h-9 items-center">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => (onBack ? onBack() : navigate(-1))}
          className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-slate-100"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[17px] font-bold">
          {title}
        </span>
      </div>
      <p className="mt-3 text-center text-sm font-medium text-muted">{step} of 4</p>
      <div className="mt-2">
        <PageIndicator current={step} />
      </div>
    </div>
  );
}

export default FlowHeader;
