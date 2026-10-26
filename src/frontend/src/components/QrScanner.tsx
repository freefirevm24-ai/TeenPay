import { type QrDecoder, createQrDecoder } from "@/lib/qr";
import { Camera, RefreshCw, ScanLine } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface QrScannerProps {
  onScan: (payload: string) => void;
  active: boolean;
}

type ScannerStatus =
  | "idle"
  | "starting"
  | "scanning"
  | "unsupported"
  | "denied"
  | "error";

/** Camera preview with continuous QR decoding. */
export function QrScanner({ onScan, active }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const decoderRef = useRef<QrDecoder | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScanRef = useRef<string>("");

  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const start = useCallback(
    async (mode: "environment" | "user") => {
      setStatus("starting");
      setErrorMessage(null);
      stop();

      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unsupported");
        setErrorMessage("This browser does not support camera access.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode },
          audio: false,
        });
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        if (!decoderRef.current) {
          decoderRef.current = await createQrDecoder();
        }
        if (!decoderRef.current) {
          setStatus("unsupported");
          setErrorMessage("QR decoding is unavailable in this browser.");
          return;
        }

        setStatus("scanning");

        const tick = async () => {
          const decoder = decoderRef.current;
          const canvas = canvasRef.current;
          if (!decoder || !canvas || !videoRef.current) return;
          const payload = await decoder.decode(videoRef.current, canvas);
          if (payload && payload !== lastScanRef.current) {
            lastScanRef.current = payload;
            onScan(payload);
          }
          rafRef.current = requestAnimationFrame(() => {
            void tick();
          });
        };
        rafRef.current = requestAnimationFrame(() => {
          void tick();
        });
      } catch (err) {
        const name = err instanceof DOMException ? err.name : "";
        if (name === "NotAllowedError" || name === "SecurityError") {
          setStatus("denied");
          setErrorMessage(
            "Camera permission was blocked. Allow access and try again.",
          );
        } else if (name === "NotFoundError") {
          setStatus("error");
          setErrorMessage("No camera found on this device.");
        } else {
          setStatus("error");
          setErrorMessage("Could not start the camera.");
        }
      }
    },
    [onScan, stop],
  );

  useEffect(() => {
    if (active) {
      void start(facingMode);
    } else {
      stop();
      setStatus("idle");
    }
    return () => stop();
  }, [active, facingMode, start, stop]);

  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-border bg-black/60">
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {status === "scanning" && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 grid place-items-center"
          >
            <div className="relative h-3/5 w-3/5 rounded-3xl border-2 border-accent/80">
              <span className="absolute inset-0 animate-pulse-ring rounded-3xl border-2 border-accent" />
              <ScanLine className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-accent" />
            </div>
          </div>
        )}

        {status !== "scanning" && (
          <div className="absolute inset-0 grid place-items-center bg-background/70 p-6 text-center">
            <div className="space-y-2">
              <Camera
                className="mx-auto h-8 w-8 text-muted-foreground"
                aria-hidden="true"
              />
              <p
                data-ocid="scan.status_message"
                className="text-sm text-muted-foreground"
              >
                {status === "starting"
                  ? "Starting camera…"
                  : (errorMessage ?? "Camera is off.")}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          data-ocid="scan.retry_button"
          onClick={() => void start(facingMode)}
          disabled={status === "starting"}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border px-4 py-3 text-sm font-semibold transition-pop hover:border-primary/60 disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {status === "scanning" ? "Restart" : "Start camera"}
        </button>
        {isMobile && (
          <button
            type="button"
            data-ocid="scan.switch_camera_button"
            onClick={() =>
              setFacingMode((m) =>
                m === "environment" ? "user" : "environment",
              )
            }
            disabled={status === "starting"}
            className="rounded-full border border-border px-4 py-3 text-sm font-semibold transition-pop hover:border-primary/60 disabled:opacity-50"
          >
            Flip
          </button>
        )}
      </div>
    </div>
  );
}
