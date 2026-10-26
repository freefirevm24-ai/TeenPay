/**
 * QR decoding helpers.
 *
 * Prefers the native BarcodeDetector API (Chromium/Android). Falls back to
 * loading jsQR from a CDN when the native detector is unavailable.
 */

interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorCtor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
}

type JsQrFn = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options?: { inversionAttempts?: string },
) => { data: string } | null;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorCtor;
    jsQR?: JsQrFn;
  }
}

let jsQrPromise: Promise<JsQrFn | null> | null = null;

function loadJsQr(): Promise<JsQrFn | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.jsQR) return Promise.resolve(window.jsQR);
  if (jsQrPromise) return jsQrPromise;
  jsQrPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
    script.async = true;
    script.onload = () => resolve(window.jsQR ?? null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
  return jsQrPromise;
}

export interface QrDecoder {
  /** Decode a QR payload from the current video frame, or null when none found. */
  decode: (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
  ) => Promise<string | null>;
  /** Human-readable decoder name for diagnostics. */
  kind: "native" | "jsqr";
}

/** Create a decoder, choosing the best available strategy. */
export async function createQrDecoder(): Promise<QrDecoder | null> {
  if (typeof window === "undefined") return null;

  if (window.BarcodeDetector) {
    try {
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      return {
        kind: "native",
        decode: async (video) => {
          try {
            const codes = await detector.detect(video);
            return codes.length > 0 ? codes[0].rawValue : null;
          } catch {
            return null;
          }
        },
      };
    } catch {
      // Fall through to jsQR.
    }
  }

  const jsQR = await loadJsQr();
  if (!jsQR) return null;

  return {
    kind: "jsqr",
    decode: async (video, canvas) => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (width === 0 || height === 0) return null;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const result = jsQR(imageData.data, width, height, {
        inversionAttempts: "dontInvert",
      });
      return result ? result.data : null;
    },
  };
}
