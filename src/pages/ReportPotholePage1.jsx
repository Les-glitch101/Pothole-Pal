import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { XIcon, FlashIcon, GalleryIcon, FlipIcon, CameraIcon, CheckIcon } from "../lib/icons";
import { useFlow } from "../context/flow";
import { POTHOLE_IMG } from "../lib/data";

function ReportPotholePage1() {
  const navigate = useNavigate();
  const { draft, setDraft } = useFlow();
  const [flash, setFlash] = useState(false);
  const cameraInput = useRef(null);
  const galleryInput = useRef(null);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDraft({ photo: URL.createObjectURL(file) });
    navigate("/report2");
  };

  const preview = draft.photo || null;

  return (
    <div className="flex min-h-screen flex-col bg-navy text-white">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 pt-5">
        <button
          type="button"
          aria-label="Close"
          onClick={() => navigate("/")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
        >
          <XIcon className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Capture Photo</h1>
        <button
          type="button"
          aria-label="Toggle flash"
          onClick={() => setFlash((f) => !f)}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
            flash ? "bg-amber-400 text-navy" : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          <FlashIcon className="h-5 w-5" />
        </button>
      </header>

      {/* Viewfinder */}
      <div className="relative mx-4 mt-6 flex-1 overflow-hidden rounded-3xl bg-gradient-to-b from-slate-700 via-slate-600 to-slate-800">
        {preview ? (
          <img src={preview} alt="Captured pothole" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <CameraIcon className="mx-auto h-14 w-14 text-white/40" strokeWidth={1.4} />
              <p className="mt-3 text-sm text-white/60">Camera preview</p>
            </div>
          </div>
        )}

        {/* Corner brackets */}
        <div className="pointer-events-none absolute inset-6">
          <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-2xl border-l-[3px] border-t-[3px] border-white/80" />
          <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-2xl border-r-[3px] border-t-[3px] border-white/80" />
          <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-2xl border-b-[3px] border-l-[3px] border-white/80" />
          <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-2xl border-b-[3px] border-r-[3px] border-white/80" />
        </div>

        {/* Hint pill */}
        <div className="absolute inset-x-0 bottom-5 flex justify-center px-6">
          <p className="rounded-full bg-black/45 px-4 py-2 text-center text-xs font-semibold text-white backdrop-blur-sm">
            Keep the pothole clearly in frame
          </p>
        </div>
      </div>

      {draft.photo && (
        <div className="mx-4 mt-4 flex items-center justify-center gap-2 rounded-full bg-emerald-500/15 py-2 text-xs font-bold text-emerald-300">
          <CheckIcon className="h-4 w-4" /> Photo added successfully
        </div>
      )}

      {/* Controls */}
      <div className="mt-5 grid grid-cols-3 items-center px-10 pb-3">
        <button
          type="button"
          aria-label="Choose from gallery"
          onClick={() => galleryInput.current?.click()}
          className="flex flex-col items-center gap-1 text-white/80 transition-colors hover:text-white"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <GalleryIcon className="h-6 w-6" />
          </span>
          <span className="text-[11px] font-semibold">Gallery</span>
        </button>

        <button
          type="button"
          aria-label="Take photo"
          onClick={() => cameraInput.current?.click()}
          className="mx-auto flex h-[74px] w-[74px] items-center justify-center rounded-full border-4 border-white/90 transition-transform active:scale-95"
        >
          <span className="h-[58px] w-[58px] rounded-full bg-white shadow-inner" />
        </button>

        <button
          type="button"
          aria-label="Flip camera"
          className="flex flex-col items-center gap-1 text-white/80 transition-colors hover:text-white"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <FlipIcon className="h-6 w-6" />
          </span>
          <span className="text-[11px] font-semibold">Flip</span>
        </button>
      </div>

      <p className="pb-7 text-center text-xs text-white/50">
        Take a clear photo for faster verification
      </p>

      {/* Hidden inputs: shutter uses the camera, gallery picks an existing file */}
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
      <input ref={galleryInput} type="file" accept="image/*" onChange={onFile} className="hidden" />

      {/* Skip for demo: continue with the placeholder photo if no camera is available */}
      {!draft.photo && (
        <button
          type="button"
          onClick={() => {
            setDraft({ photo: POTHOLE_IMG });
            navigate("/report2");
          }}
          className="mx-4 mb-6 rounded-2xl bg-white/10 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20"
        >
          Continue with sample photo
        </button>
      )}
    </div>
  );
}

export default ReportPotholePage1;
