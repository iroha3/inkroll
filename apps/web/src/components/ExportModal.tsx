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
  Share2,
} from 'lucide-react';
import { renderElementToImageData, downloadDataUrl } from '../utils/exportImage';
import { CardConfig, RenderMode } from '../types';
import { InkrollCore } from '@inkroll/core';

interface ExportModalProps {
  cardRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  onClose: () => void;
  content: string;
  config: CardConfig;
  renderMode?: RenderMode;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  cardRef,
  isOpen,
  onClose,
  content,
  config,
  renderMode,
}) => {
  const [exportMode, setExportMode] = useState<'single' | 'social-multi'>('single');
  const [scale] = useState<number>(3); // Default 3x Retina
  const [format] = useState<'png' | 'jpeg'>('png');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const sceneInfoMap: Record<string, { label: string; name: string; size: string }> = {
    xiaohongshu: { label: '小红书卡片', name: '小红书标准卡片 (3:4)', size: '1242×1660' },
    weibo: { label: '微博卡片', name: '微博黄金图文卡片 (3:4)', size: '1242×1660' },
    square: { label: '朋友圈卡片', name: '朋友圈方形卡片 (1:1)', size: '1242×1242' },
    slide: { label: 'X / 幻灯片卡片', name: 'X / Bsky / 幻灯片卡片 (16:9)', size: '1920×1080' },
    story: { label: '竖屏海报', name: '竖屏全景海报 (9:16)', size: '1080×1920' },
  };
  const activeSceneInfo = (config.scene && sceneInfoMap[config.scene]) || sceneInfoMap.xiaohongshu;

  // 当弹窗打开时，若当前处于分页卡片模式，自动进入多图导出
  useEffect(() => {
    if (isOpen) {
      setExportMode(renderMode === 'paged' ? 'social-multi' : 'single');
    }
  }, [isOpen, renderMode]);

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
    try {
      setIsExporting(true);
      let dataUrl: string;

      if (renderMode === 'paged') {
        dataUrl = await InkrollCore.toImage(content, {
          ...config,
          exportScale: scale as 2 | 3,
          exportFormat: format,
        });
      } else if (cardRef.current) {
        dataUrl = (await renderElementToImageData(
          cardRef.current,
          { scale, format },
          false
        )) as string;
      } else {
        throw new Error('未找到卡片元素');
      }

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
        const res = await fetch(dataUrlToCopy);
        targetBlob = await res.blob();
      } else if (renderMode === 'paged') {
        const dataUrl = await InkrollCore.toImage(content, {
          ...config,
          exportScale: scale as 2 | 3,
          exportFormat: 'png',
        });
        const res = await fetch(dataUrl);
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
      alert(err.message || '复制图片失败，请直接点击保存图片');
    } finally {
      setIsExporting(false);
    }
  };

  // 4. 移动端原生系统分享与保存到相册
  const handleNativeShare = async (dataUrlToShare?: string) => {
    try {
      setIsExporting(true);
      let dataUrl = dataUrlToShare;
      if (!dataUrl) {
        if (renderMode === 'paged') {
          dataUrl = await InkrollCore.toImage(content, {
            ...config,
            exportScale: scale as 2 | 3,
            exportFormat: format,
          });
        } else if (cardRef.current) {
          dataUrl = (await renderElementToImageData(
            cardRef.current,
            { scale, format },
            false
          )) as string;
        }
      }

      if (!dataUrl) throw new Error('生成图片数据失败');

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const fileName = `inkroll_${Date.now()}.${format}`;
      const file = new File([blob], fileName, { type: blob.type || 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: '墨卷 InkRoll 卡片',
          text: '来自墨卷 InkRoll 排版生成的精致图文卡片',
        });
      } else {
        downloadDataUrl(dataUrl, fileName);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Share error:', err);
        alert(err.message || '系统分享失败，已尝试直接下载保存');
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-neutral-100 relative animate-in fade-in zoom-in duration-200 max-h-[92dvh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-neutral-400 hover:text-black p-1.5 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className="p-2 sm:p-2.5 bg-black text-white rounded-xl shrink-0">
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-neutral-900">导出长图卡片</h3>
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
            <span>长图模式</span>
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
            <span>{activeSceneInfo.label}</span>
          </button>
        </div>

        {/* 社交多图切片专用展示区 */}
        {exportMode === 'social-multi' && (
          <div className="mb-4 p-3 bg-neutral-50 border border-neutral-200/80 rounded-xl">
            {isSlicing ? (
              <div className="flex items-center justify-center py-6 gap-2 text-xs text-neutral-500">
                <Sparkles className="w-4 h-4 animate-spin text-black" />
                <span>正在以{activeSceneInfo.name} ({activeSceneInfo.size}) 智能分页…</span>
              </div>
            ) : multiImages.length > 0 ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-neutral-700 flex items-center gap-1.5 text-[11px] sm:text-xs">
                    <FileCheck className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    <span className="truncate">
                      {multiImages.length > 1
                        ? `已拆分为 ${multiImages.length} 张卡片`
                        : `单张卡片 (${activeSceneInfo.size}) 即可容纳`}
                    </span>
                  </span>
                  {multiImages.length > 1 && (
                    <div className="flex items-center gap-1 shrink-0">
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
                <div className="flex justify-center bg-white border border-neutral-200 rounded-lg p-2 max-h-40 sm:max-h-48 overflow-hidden shadow-inner">
                  <img
                    src={multiImages[currentSlice]}
                    alt={`Slice ${currentSlice + 1}`}
                    className="max-h-36 sm:max-h-44 object-contain rounded shadow-sm"
                  />
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {exportMode === 'single' ? (
            <>
              {/* Native System Share (Preferred on Mobile) */}
              {canShare && (
                <button
                  onClick={() => handleNativeShare()}
                  disabled={isExporting}
                  className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60 cursor-pointer active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  <span>系统分享 / 保存到相册</span>
                </button>
              )}

              {/* Primary: Copy to clipboard */}
              <button
                onClick={() => handleCopyImage()}
                disabled={isExporting}
                className={`w-full py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60 cursor-pointer active:scale-95 ${
                  canShare
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                    : 'bg-black hover:bg-neutral-800 text-white'
                }`}
              >
                {copiedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span>已复制到剪贴板</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>复制图片</span>
                  </>
                )}
              </button>

              {/* Secondary: Download image */}
              <button
                onClick={handleDownloadSingle}
                disabled={isExporting}
                className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer active:scale-95"
              >
                {isExporting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>正在生成...</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span>长图已保存</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-neutral-600" />
                    <span>下载图片文件</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Native System Share for Social Slice */}
              {canShare && (
                <button
                  onClick={() => handleNativeShare(multiImages[currentSlice])}
                  disabled={isExporting || isSlicing || multiImages.length === 0}
                  className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60 cursor-pointer active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  <span>系统分享当前卡片</span>
                </button>
              )}

              <button
                onClick={() => handleCopyImage(multiImages[currentSlice])}
                disabled={isExporting || isSlicing || multiImages.length === 0}
                className={`w-full py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60 cursor-pointer active:scale-95 ${
                  canShare
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                    : 'bg-black hover:bg-neutral-800 text-white'
                }`}
              >
                {copiedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span>已复制第 {currentSlice + 1} 张</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>复制当前卡片</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadMulti}
                disabled={isExporting || isSlicing || multiImages.length === 0}
                className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer active:scale-95"
              >
                {isExporting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>正在导出切片...</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span>卡片已下载</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-neutral-600" />
                    <span>保存全部卡片 ({multiImages.length} 张)</span>
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
