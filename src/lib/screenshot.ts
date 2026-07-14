import { toPng } from "html-to-image";

/**
 * Rasterizes a DOM node to a PNG and triggers a browser download.
 * Uses html-to-image (SVG foreignObject based) rather than html2canvas,
 * since it renders modern CSS (gradients, backdrop-filter, our flip-card
 * 3D transforms) much more faithfully.
 */
export async function downloadElementAsImage(element: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    backgroundColor: "#faf6ee",
  });

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
