import { exportElement, downloadDataUrl } from '@inkroll/core';

export { downloadDataUrl };

export interface ExportOptions {
  scale?: number;
  format?: 'png' | 'jpeg';
  quality?: number;
  backgroundColor?: string;
}

export async function renderElementToImageData(
  element: HTMLElement,
  options: ExportOptions = {},
  returnBlob = false
): Promise<string | Blob> {
  const { scale = 3, format = 'png' } = options;
  const dataUrl = await exportElement(element, scale, format);

  if (!returnBlob) {
    return dataUrl;
  }

  const res = await fetch(dataUrl);
  return await res.blob();
}
