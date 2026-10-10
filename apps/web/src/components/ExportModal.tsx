import React, { useState, useEffect } from 'react';
import {
  Download,
  Copy,
  Check,
  Sparkles,
  X,
  Image as ImageIcon,
  Layers,
  ChevronLeft,
  ChevronRight,
  FileCheck,
} from 'lucide-react';
import { renderElementToImageData, downloadDataUrl } from '../utils/exportImage';
import { CardConfig } from '../types';
import { InkrollCore } from '@inkroll/core';

interface ExportModalProps {
  cardRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  onClose: () => void;
  content: string;
  config: CardConfig;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  cardRef,
  isOpen,
  onClose,
  content,
  config,
}) => {
  const [exportMode, setExportMode] = useState<'single' | 'social-multi'>('single');
  const [scale, setScale] = useState<number>(3); // Default 3x Retina
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // 社交多图切片状态
  const [multiImages, setMultiImages] = useState<string[]>([]);
  const [currentSlice, setCurrentSlice] = useState<number>(0);
  const [isSlicing, setIsSlicing] = useState<boolean>(false);

  // 当切换到社交多图模式时，自动生成切片
  useEffect(() => {
    if (!isOpen || exportMode !== 'social-multi') return;

    let cancelled = false;
    const generateSlices = async () => {
      try {
        setIsSlicing(true);
        const images = await InkrollCore.toMultiImages(content, {
          ...config,
          exportScale: scale as 2 | 3,
          exportFormat: format,
        });
        if (!cancelled) {
          setMultiImages(images);
          setCurrentSlice(0);
        }
      } catch (err) {
        console.error('Failed to generate multi-image slices:', err);
      } finally {
        if (!cancelled) setIsSlicing(false);
      }
    };

    void generateSlices();
    return () => {
      cancelled = true;
    };
  }, [isOpen, exportMode, content, config, scale, format]);

  if (!isOpen) return null;

  // 1. 单张长图下载
  const handleDownloadSingle = async () => {
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
      const fileName = `inkroll_${timestamp}.${format}`;

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

  // 2. 社交多图片段批量下载
  const handleDownloadMulti = async () => {
    if (multiImages.length === 0) return;
    try {
      setIsExporting(true);
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');

      for (let i = 0; i < multiImages.length; i++) {
        const fileName = `inkroll_social_part${i + 1}_of_${multiImages.length}_${timestamp}.${format}`;
        downloadDataUrl(multiImages[i], fileName);
        // 间隔 180ms，避免部分浏览器并发下载节流限制
        await new Promise((r) => setTimeout(r, 180));
      }

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err: any) {
      console.error('Failed to download slices:', err);
      alert(err.message || '切片下载失败');
    } finally {
      setIsExporting(false);
    }
  };

  // 3. 复制到剪贴板
  const handleCopyImage = async (dataUrlToCopy?: string) => {
    try {
      setIsExporting(true);
      let targetBlob: Blob | null = null;

      if (dataUrlToCopy) {
        // 将已有切片 dataURL 转为 Blob
        const res = await fetch(dataUrlToCopy);
        targetBlob = await res.blob();
      } else if (cardRef.current) {
        targetBlob = (await renderElementToImageData(
          cardRef.current,
          { scale, format: 'png' },
          true
        )) as Blob;
      }

      if (!targetBlob) throw new Error('生成图片失败');

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            [targetBlob.type]: targetBlob,
          }),
        ]);
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 2500);
      } else {
        alert('您的浏览器不支持直接复制图片，请点击下载保存');
      }
    } catch (err: any) {
      console.error('Failed to copy image:', err);
      alert(err.message || '复制图片失败，请直接点击下载');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-100 relative animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-black p-1 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-black text-white rounded-xl">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-neutral-900">导出长图卡片</h3>
            <p className="text-xs text-neutral-500">将 Markdown 完美还原为精致出版级图片</p>
          </div>
        </div>

        {/* 模式选择 Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-100 rounded-xl mb-4 border border-neutral-200/60">
          <button
            onClick={() => setExportMode('single')}
            className={`py-2 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              exportMode === 'single'
                ? 'bg-white text-black shadow-sm font-semibold'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>单张长图 (完整版)</span>
          </button>

          <button
            onClick={() => setExportMode('social-multi')}
            className={`py-2 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              exportMode === 'social-multi'
                ? 'bg-white text-black shadow-sm font-semibold'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>社交多图 (小红书/微博)</span>
          </button>
        </div>

        {/* 社交多图切片专用展示区 */}
        {exportMode === 'social-multi' && (
          <div className="mb-4 p-3 bg-neutral-50 border border-neutral-200/80 rounded-xl">
            {isSlicing ? (
              <div className="flex items-center justify-center py-6 gap-2 text-xs text-neutral-500">
                <Sparkles className="w-4 h-4 animate-spin text-black" />
                <span>正在计算段落块边界并智能分页…</span>
              </div>
            ) : multiImages.length > 0 ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-neutral-700 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-green-600" />
                    {multiImages.length > 1
                      ? `已安全拆分为 ${multiImages.length} 张黄金比例卡片 (防压缩模糊)`
                      : '全文篇幅精炼，单张黄金比例即可容纳'}
                  </span>
                  {multiImages.length > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentSlice((i) => Math.max(0, i - 1))}
                        disabled={currentSlice === 0}
                        className="p-1 hover:bg-neutral-200 rounded disabled:opacity-30 cursor-pointer"
                        title="上一张"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono font-medium text-[11px] px-1">
                        {currentSlice + 1} / {multiImages.length}
                      </span>
                      <button
                        onClick={() => setCurrentSlice((i) => Math.min(multiImages.length - 1, i + 1))}
                        disabled={currentSlice === multiImages.length - 1}
                        className="p-1 hover:bg-neutral-200 rounded disabled:opacity-30 cursor-pointer"
                        title="下一张"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 切片微缩预览 */}
                <div className="flex justify-center bg-white border border-neutral-200 rounded-lg p-2 max-h-48 overflow-hidden shadow-inner">
                  <img
                    src={multiImages[currentSlice]}
                    alt={`Slice ${currentSlice + 1}`}
                    className="max-h-44 object-contain rounded shadow-sm"
                  />
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Export Options */}
        <div className="space-y-3 mb-5">
          {/* Resolution / DPI */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
              导出清晰度
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { scale: 2, label: '2x 高清' },
                { scale: 3, label: '3x 超清视网膜 (推荐)' },
              ].map((item) => (
                <button
                  key={item.scale}
                  onClick={() => setScale(item.scale)}
                  className={`py-1.5 px-3 text-xs border rounded-lg text-left transition-all cursor-pointer ${
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
                { id: 'png', label: 'PNG (无损画质)' },
                { id: 'jpeg', label: 'JPEG (文件更小)' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id as 'png' | 'jpeg')}
                  className={`py-1.5 px-3 text-xs border rounded-lg text-left transition-all cursor-pointer ${
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
        <div className="space-y-2">
          {exportMode === 'single' ? (
            <>
              <button
                onClick={handleDownloadSingle}
                disabled={isExporting}
                className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow transition-all disabled:opacity-60 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>正在光栅化长图...</span>
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
                onClick={() => handleCopyImage()}
                disabled={isExporting}
                className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
              >
                {copiedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span>已复制到剪贴板！</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-neutral-600" />
                    <span>直接复制图片到剪贴板</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDownloadMulti}
                disabled={isExporting || isSlicing || multiImages.length === 0}
                className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow transition-all disabled:opacity-60 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>正在依次导出切片...</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span>全部切片已下载完成！</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>批量下载全部切片 ({multiImages.length} 张)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleCopyImage(multiImages[currentSlice])}
                disabled={isExporting || isSlicing || multiImages.length === 0}
                className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
              >
                {copiedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span>已复制第 {currentSlice + 1} 张到剪贴板！</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-neutral-600" />
                    <span>复制当前第 {currentSlice + 1} 张图片</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
