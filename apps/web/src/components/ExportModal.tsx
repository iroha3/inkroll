import React, { useState } from 'react';
import { Download, Copy, Check, Sparkles, X, Image as ImageIcon } from 'lucide-react';
import { renderElementToImageData, downloadDataUrl } from '../utils/exportImage';

interface ExportModalProps {
  cardRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ cardRef, isOpen, onClose }) => {
  const [scale, setScale] = useState<number>(3); // Default 3x Retina
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  // Download Image File
  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = (await renderElementToImageData(
        cardRef.current,
        { scale, format },
        false
      )) as string;

      if (!dataUrl) throw new Error('生成图片数据失败');

      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const fileName = `markdown_card_${timestamp}.${format}`;

      downloadDataUrl(dataUrl, fileName);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err: any) {
      console.error('Failed to export image:', err);
      alert(err.message || '图片导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const blob = (await renderElementToImageData(
        cardRef.current,
        { scale, format: 'png' },
        true
      )) as Blob;

      if (!blob) throw new Error('生成图片 Blob 失败');

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ]);
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 2500);
      } else {
        alert('您的浏览器不支持直接复制图片到剪贴板，请点击“下载长图到本地”保存');
      }
    } catch (err: any) {
      console.error('Failed to copy image:', err);
      alert(err.message || '复制图片失败，请重试或直接点击下载');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 relative animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-black p-1 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-black text-white rounded-xl">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-neutral-900">高清长图导出</h3>
            <p className="text-xs text-neutral-500">将 Markdown 完美还原为精致图片</p>
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-4 mb-6">
          {/* Resolution / DPI */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
              导出清晰度 (DPI)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { scale: 2, label: '2x 高清 (社交媒体)' },
                { scale: 3, label: '3x 超清 / 视网膜 (推荐)' },
              ].map((item) => (
                <button
                  key={item.scale}
                  onClick={() => setScale(item.scale)}
                  className={`py-2 px-3 text-xs border rounded-xl text-left transition-all ${
                    scale === item.scale
                      ? 'bg-black text-white border-black font-semibold shadow-sm'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5">图片格式</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'png', label: 'PNG (无损/透明)' },
                { id: 'jpeg', label: 'JPEG (高压缩比)' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id as 'png' | 'jpeg')}
                  className={`py-2 px-3 text-xs border rounded-xl text-left transition-all ${
                    format === f.id
                      ? 'bg-neutral-900 text-white border-neutral-900 font-semibold'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="w-full py-3 bg-black hover:bg-neutral-800 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-60 cursor-pointer"
          >
            {isExporting ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>正在编译长图...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span>长图已成功下载！</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>下载长图到本地</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyImage}
            disabled={isExporting}
            className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
          >
            {copiedSuccess ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span>已复制到剪贴板！可以直接粘贴</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-neutral-600" />
                <span>直接复制图片 (可直接粘贴)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
