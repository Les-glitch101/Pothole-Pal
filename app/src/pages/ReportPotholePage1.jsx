import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { XIcon, FlashIcon, GalleryIcon, FlipIcon, CameraIcon, CheckIcon } from "../lib/icons";
import { useFlow } from "../context/flow";
import { POTHOLE_IMG } from "../lib/data";

/**
 * Step 1: capture the pothole.
 *
 * The viewfinder is a live getUserMedia stream (back camera by default).
 * - Flip switches between the rear and front cameras.
 * - Flash toggles the torch when the device exposes one (Android Chrome);
 *   elsewhere the button is shown but disabled.
 * - The shutter snapshots the live stream to a JPEG. On pages without a usable
 *   camera (http:// over the LAN, desktops without a webcam, denied
 *   permission) it falls back to the native photo picker, and the gallery /
 *   sample buttons still work.
 */
function ReportPotholePage1() {
  const navigate = useNavigate();
  const { draft, setDraft } = useFlow();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cameraInput = useRef(null);
  const galleryInput = useRef(null);

  const [facing, setFacing] = useState("environment");
  const [cam, setCam] = useState("starting"); // starting | live | denied | unavailable
  const [flashOn, setFlashOn] = useState(false);
  const [flashOk, setFlashOk] = useState(false);

  // Acquire (or re-acquire after a flip) the camera stream.
  useEffect(() => {
    let cancelled = false;
    const video = videoRef.current;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCam("unavailable");
        return;
      }
      setCam((c) => (c === "live" ? c : "starting"));
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (video) {
          video.srcObject = stream;
          try {
            await video.play();
          } catch {
            // autoplay is allowed for muted inline video; ignore stray rejections
          }
        }
        const track = stream.getVideoTracks()[0];
        const caps = track?.getCapabilities?.() || {};
        setFlashOk(Boolean(caps.torch));
        setCam("live");
      } catch (err) {
        if (cancelled) return;
        setFlashOn(false);
        setFlashOk(false);
        setCam(
          err?.name === "NotAllowedError" || err?.name === "SecurityError"
            ? "denied"
            : "unavailable",
        );
      }
    }

    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (video) video.srcObject = null;
    };
  }, [facing]);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const old = draft.photo;
    if (old?.startsWith("blob:")) URL.revokeObjectURL(old);
    setDraft({ photo: URL.createObjectURL(file) });
    navigate("/report2");
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (facing === "user") {
      // Match the mirrored preview so selfies look the same in the photo.
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const old = draft.photo;
        if (old?.startsWith("blob:")) URL.revokeObjectURL(old);
        setDraft({ photo: URL.createObjectURL(blob) });
        navigate("/report2");
      },
      "image/jpeg",
      0.9,
    );
  };

  const toggleFlash = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !flashOk) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !flashOn }] });
      setFlashOn((f) => !f);
    } catch {
      setFlashOk(false);
      setFlashOn(false);
    }
  };

  const preview = draft.photo || null;
  const camNote =
    cam === "starting"
      ? "Starting camera..."
      : cam === "denied"
        ? "Camera access is blocked. Allow the camera for this page, or pick a photo below."
        : cam === "unavailable"
          ? window.isSecureContext
            ? "No camera available here. Pick a photo from the gallery, or continue with the sample."
            : "This page is not secure (http), so the live camera is off. Use Gallery, or continue with the sample."
          : null;

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
          disabled={cam !== "live" || !flashOk}
          onClick={toggleFlash}
          title={flashOk ? undefined : "Flash not available on this device"}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
            flashOn ? "bg-amber-400 text-navy" : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          <FlashIcon className="h-5 w-5" />
        </button>
      </header>

      {/* Viewfinder */}
      <div className="relative mx-4 mt-6 flex-1 overflow-hidden rounded-3xl bg-gradient-to-b from-slate-700 via-slate-600 to-slate-800">
        {/* Live stream sits underneath; the still layers cover it until it is ready. */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 h-full w-full object-cover ${
            cam === "live" ? (facing === "user" ? "-scale-x-100" : "") : "invisible"
          }`}
        />

        {cam !== "live" &&
          (preview ? (
            <img
              src={preview}
              alt="Captured pothole"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <CameraIcon className="mx-auto h-14 w-14 text-white/40" strokeWidth={1.4} />
                <p className="mt-3 text-sm text-white/60">Camera preview</p>
              </div>
            </div>
          ))}

        {/* Corner brackets */}
        <div className="pointer-events-none absolute inset-6">
          <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-2xl border-l-[3px] border-t-[3px] border-white/80" />
          <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-2xl border-r-[3px] border-t-[3px] border-white/80" />
          <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-2xl border-b-[3px] border-l-[3px] border-white/80" />
          <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-2xl border-b-[3px] border-r-[3px] border-white/80" />
        </div>

        {/* Hint pill / camera status */}
        <div className="absolute inset-x-0 bottom-5 flex justify-center px-6">
          <p className="rounded-full bg-black/45 px-4 py-2 text-center text-xs font-semibold text-white backdrop-blur-sm">
            {camNote || "Keep the pothole clearly in frame"}
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
          onClick={() => (cam === "live" ? capture() : cameraInput.current?.click())}
          className="mx-auto flex h-[74px] w-[74px] items-center justify-center rounded-full border-4 border-white/90 transition-transform active:scale-95"
        >
          <span className="h-[58px] w-[58px] rounded-full bg-white shadow-inner" />
        </button>

        <button
          type="button"
          aria-label="Flip camera"
          disabled={cam !== "live"}
          onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
          className="flex flex-col items-center gap-1 text-white/80 transition-colors hover:text-white disabled:opacity-40"
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

      {/* Shutter falls back to the native picker when there is no live stream
          (http:// over the LAN, no webcam, or permission denied). */}
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
      <input ref={galleryInput} type="file" accept="image/*" onChange={onFile} className="hidden" />

      {/* Skip for demo: continue with the placeholder photo if no camera is available */}
      {cam !== "live" && !preview && (
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
