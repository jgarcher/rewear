"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
};

// Custom front-camera selfie capture. iOS Safari is unreliable with
// `<input type="file" capture="user">` — sometimes it opens the rear camera
// regardless. This component uses getUserMedia with facingMode:"user" which
// reliably picks the front-facing camera on every modern browser.
export function SelfieCapture({ open, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  // Open camera when the modal opens; tear down on close.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setReady(false);

    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("This browser doesn't support live camera capture.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "user" },
            width: { ideal: 1080 },
            height: { ideal: 1440 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // playsInline + autoPlay handle most cases; play() returns a promise we ignore safely.
          videoRef.current.play().catch(() => {});
        }
        setReady(true);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Camera unavailable";
        if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("notallowed")) {
          setError("Camera permission denied. Allow camera access and try again.");
        } else {
          setError(msg);
        }
      }
    }
    start();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function capture() {
    const video = videoRef.current;
    if (!video || !ready) return;
    setBusy(true);

    try {
      const canvas = document.createElement("canvas");
      // Use the video's intrinsic dimensions so the output isn't cropped.
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Couldn't initialise canvas");

      // Mirror the captured image so it matches what the user sees in the
      // preview (which is also mirrored). Mirrors look more natural for selfies.
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setBusy(false);
            setError("Couldn't grab a frame — try again.");
            return;
          }
          const file = new File([blob], `selfie-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          onCapture(file);
          setBusy(false);
        },
        "image/jpeg",
        0.92
      );
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Capture failed");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/95 p-4">
      <div className="relative flex w-full max-w-md flex-col items-center">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-0 top-0 -mr-2 -mt-2 rounded-full bg-linen-100/90 p-2 text-charcoal shadow"
        >
          <span aria-hidden className="block h-5 w-5 text-center text-xl leading-5">
            ×
          </span>
        </button>

        {/* Preview */}
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-charcoal-soft">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-sm text-linen-100">
              <p className="font-heading text-lg font-medium">
                Camera unavailable
              </p>
              <p className="mt-2 text-linen-100/80">{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 rounded-full bg-linen-100 px-5 py-2 text-sm font-medium text-charcoal"
              >
                Close
              </button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
              // Mirror the live preview so the user sees themselves the right
              // way round (matches how the front camera typically shows you).
              style={{ transform: "scaleX(-1)" }}
            />
          )}

          {!error && !ready && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-linen-100/70">
              Starting camera…
            </div>
          )}
        </div>

        {/* Shutter */}
        {!error && (
          <button
            type="button"
            onClick={capture}
            disabled={!ready || busy}
            aria-label="Capture selfie"
            className="mt-6 flex h-16 w-16 items-center justify-center rounded-full border-4 border-linen-100 bg-linen-100/95 transition-transform active:scale-95 disabled:opacity-50"
          >
            <span className="block h-12 w-12 rounded-full bg-forest-500" />
          </button>
        )}

        <p className="mt-4 text-xs text-linen-100/70">
          {busy
            ? "Saving…"
            : ready
            ? "Hold still and tap the button"
            : ""}
        </p>
      </div>
    </div>
  );
}
