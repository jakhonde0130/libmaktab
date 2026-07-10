import QRCode from "qrcode";
import { useEffect, useRef } from "react";

export function QrCodeDisplay({ value, size = 120 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, { width: size, margin: 1 });
    }
  }, [value, size]);

  return <canvas ref={canvasRef} />;
}
