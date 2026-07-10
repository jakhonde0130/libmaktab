import JsBarcode from "jsbarcode";
import { useEffect, useRef } from "react";

export function BarcodeDisplay({ value, height = 50 }: { value: string; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      JsBarcode(svgRef.current, value, {
        format: "CODE128",
        height,
        fontSize: 12,
        margin: 4,
      });
    }
  }, [value, height]);

  return <svg ref={svgRef} />;
}
