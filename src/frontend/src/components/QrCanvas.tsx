import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";

interface QrCanvasProps {
  value: string;
  size?: number;
  className?: string;
}

/** Render a QR code onto a canvas from a payload string. */
export function QrCanvas({ value, size = 220, className }: QrCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    setError(false);
    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 1,
      color: { dark: "#0f0a14", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).catch(() => setError(true));
  }, [value, size]);

  if (error) {
    return (
      <p
        data-ocid="qr.error_state"
        className="rounded-2xl border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      >
        Could not render your QR code.
      </p>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      data-ocid="qr.canvas"
      width={size}
      height={size}
      className={className}
      aria-label="Your personal QR code"
    />
  );
}
