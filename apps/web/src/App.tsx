import { useState, useRef, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Editor } from './components/Editor';
import { CardPreview } from './components/CardPreview';
import { SettingsPanel } from './components/SettingsPanel';
import { ExportModal } from './components/ExportModal';
import { AboutModal } from './components/AboutModal';
import { CardConfig, RenderMode, ScenePreset } from './types';
import { useIsMobile } from './hooks/useMediaQuery';
import { Edit3, Eye } from 'lucide-react';

// localStorage keys for auto-save persistence
const CONTENT_STORAGE_KEY = 'md-card-content';
const CONFIG_STORAGE_KEY = 'md-card-config';
const RENDER_MODE_STORAGE_KEY = 'md-card-render-mode';
const SCENE_STORAGE_KEY = 'md-card-scene';

// 默认卡片内容：极简生活法则金句
export const DEFAULT_CARD_MARKDOWN = `# 📖 极简生活法则

> "简单不是少，而是刚好。" —— 密斯·凡德罗

人生就像清理磁盘，定期清理不重要的杂物，才能给真正重要的事情腾出空间。

---

### 核心三原则：

1. **聚焦**：同时只做一件事，做到极致。
2. **断舍离**：不执着于过往，不焦虑于未来。
3. **沉淀**：每天留出 30 分钟无打扰思考时间。

==真正的自由，是拥有拒绝的权利。==`;

// 默认卡片排版配置：纯白 + 黑体 (Sans)
const DEFAULT_CONFIG: CardConfig = {
  showTitle: false,
  titleText: '',
  showRoleBadges: false,
  userBadgeText: 'User',
  userBadgeIcon: '👨‍💻',
  assistantBadgeText: 'Assistant',
  assistantBadgeIcon: '🤖',
  cardWidth: 460,
  padding: 'spacious',
  borderRadius: 12,
  theme: 'classic-white', // 纯白
  customBgColor: '',
  customTextColor: '',
  fontFamily: 'sans', // 现代无衬线黑体
  fontSize: 'base',
  lineHeight: 'relaxed',
  showWatermark: true,
  watermarkText: 'By InkRoll',
  watermarkPosition: 'bottom-right',
  canvasBg: 'neutral-gray',
  exportScale: 3,
  exportFormat: 'png',
  scene: 'xiaohongshu',
};

export default function App() {
  const isMobile = useIsMobile(1024);
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');

  // 从 localStorage 恢复，首次访问默认填充极简卡片
  const [content, setContent] = useState<string>(() => {
    try {
      return localStorage.getItem(CONTENT_STORAGE_KEY) ?? DEFAULT_CARD_MARKDOWN;
    } catch {
      return DEFAULT_CARD_MARKDOWN;
    }
  });

  const [renderMode, setRenderMode] = useState<RenderMode>(() => {
    try {
      const saved = localStorage.getItem(RENDER_MODE_STORAGE_KEY);
      if (saved === 'continuous' || saved === 'paged') return saved;
    } catch {
      /* ignore */
    }
    return 'paged';
  });

  const [config, setConfig] = useState<CardConfig>(() => {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      const savedScene = localStorage.getItem(SCENE_STORAGE_KEY) as ScenePreset | null;
      const rawScene = savedScene || parsed.scene || DEFAULT_CONFIG.scene || 'xiaohongshu';
      const validScene: ScenePreset =
        rawScene === 'square' || rawScene === 'xiaohongshu' ? rawScene : 'xiaohongshu';
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        scene: validScene,
      };
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [viewMode, setViewMode] = useState<'split' | 'preview-only' | 'editor-only'>('split');
  const [pageCount, setPageCount] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showSettings, setShowSettings] = useState<boolean>(() => {
    // 桌面端默认展开设置抽屉，移动端默认收起
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);

  const cardRef = useRef<HTMLDivElement>(null);

  // Undo/redo history
  const contentRef = useRef(content);
  const historyRef = useRef<{
    past: string[];
    future: string[];
    lastChange: number;
  }>({ past: [], future: [], lastChange: 0 });

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const updateContent = (next: string) => {
    const prev = contentRef.current;
    if (prev === next) return;
    const h = historyRef.current;
    const now = Date.now();
    if (!(now - h.lastChange < 600 && h.past.length > 0)) {
      h.past.push(prev);
      if (h.past.length > 100) h.past.shift();
    }
    h.future = [];
    h.lastChange = now;
    contentRef.current = next;
    setContent(next);
  };

  const handleUndo = () => {
    const current = contentRef.current;
    const h = historyRef.current;
    const prev = h.past.pop();
    if (prev === undefined) return;
    h.future.push(current);
    h.lastChange = 0;
    contentRef.current = prev;
    setContent(prev);
  };

  const handleRedo = () => {
    const current = contentRef.current;
    const h = historyRef.current;
    const next = h.future.pop();
    if (next === undefined) return;
    h.past.push(current);
    h.lastChange = 0;
    contentRef.current = next;
    setContent(next);
  };

  // 恢复默认示例
  const handleResetDefault = () => {
    updateContent(DEFAULT_CARD_MARKDOWN);
    setConfig((prev) => ({
      ...prev,
      theme: 'classic-white',
      fontFamily: 'sans',
      cardWidth: 460,
      padding: 'spacious',
    }));
  };

  // Auto-save content & config
  useEffect(() => {
    try {
      localStorage.setItem(CONTENT_STORAGE_KEY, content);
    } catch {
      /* storage unavailable */
    }
  }, [content]);

  useEffect(() => {
    try {
      localStorage.setItem(RENDER_MODE_STORAGE_KEY, renderMode);
    } catch {
      /* storage unavailable */
    }
  }, [renderMode]);

  useEffect(() => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
      if (config.scene) {
        localStorage.setItem(SCENE_STORAGE_KEY, config.scene);
      }
    } catch {
      /* storage unavailable */
    }
  }, [config]);

  const [resetScrollTrigger, setResetScrollTrigger] = useState<number>(0);

  const handleSelectScene = (newScene: ScenePreset) => {
    setConfig((prev) => ({ ...prev, scene: newScene }));
    setRenderMode('paged');
    setResetScrollTrigger((prev) => prev + 1);
    try {
      localStorage.setItem(SCENE_STORAGE_KEY, newScene);
      localStorage.setItem(RENDER_MODE_STORAGE_KEY, 'paged');
    } catch {
      /* storage unavailable */
    }
  };

  const handleSelectRenderMode = (mode: RenderMode) => {
    setRenderMode(mode);
    setResetScrollTrigger((prev) => prev + 1);
    try {
      localStorage.setItem(RENDER_MODE_STORAGE_KEY, mode);
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <div
      className="w-full h-full h-[100dvh] flex flex-col overflow-hidden font-sans"
      style={{ backgroundColor: '#f5f5f7' }}
    >
      {/* 顶栏 Navbar */}
      <Navbar
        onExportClick={() => setIsExportModalOpen(true)}
        onAboutClick={() => setIsAboutModalOpen(true)}
        viewMode={viewMode}
        setViewMode={setViewMode}
        renderMode={renderMode}
        setRenderMode={handleSelectRenderMode}
        scene={config.scene || 'xiaohongshu'}
        onSelectScene={handleSelectScene}
        pageCount={pageCount}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
      />

      {/* 工作区 */}
      <main
        className="flex-1 flex overflow-hidden relative"
        style={{ position: 'relative', zIndex: 1, backgroundColor: '#f5f5f7' }}
      >
        {/* 1. 移动端视图 (屏幕宽度 < 1024px)：沉浸式单视图 + 触控标签切换 */}
        {isMobile ? (
          mobileTab === 'editor' ? (
            <div className="w-full h-full min-h-0 flex flex-col bg-white">
              <Editor
                content={content}
                onChange={updateContent}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onResetDefault={handleResetDefault}
                config={config}
                onGoToPreview={() => setMobileTab('preview')}
                isMobile={true}
              />
            </div>
          ) : (
            <div
              className="w-full h-full overflow-hidden relative"
              style={{ backgroundColor: '#f5f5f7' }}
            >
              <CardPreview
                content={content}
                config={config}
                cardRef={cardRef}
                zoomLevel={zoomLevel}
                renderMode={renderMode}
                resetScrollTrigger={resetScrollTrigger}
                onPageCountChange={setPageCount}
                isMobile={true}
              />
            </div>
          )
        ) : (
          /* 2. 桌面端双栏/三栏视口 (屏幕宽度 >= 1024px) */
          <>
            {/* 左侧：Markdown 编辑器 */}
            {(viewMode === 'split' || viewMode === 'editor-only') && (
              <div
                className={`${
                  viewMode === 'editor-only'
                    ? 'w-full'
                    : 'w-full lg:w-[42%] xl:w-[38%] min-w-[380px] lg:min-w-[420px]'
                } h-full z-10 transition-all shrink-0`}
              >
                <Editor
                  content={content}
                  onChange={updateContent}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  onResetDefault={handleResetDefault}
                  config={config}
                  isMobile={false}
                />
              </div>
            )}

            {/* 中间：长图画布预览区 */}
            {(viewMode === 'split' || viewMode === 'preview-only') && (
              <div className="flex-1 h-full overflow-hidden relative">
                <CardPreview
                  content={content}
                  config={config}
                  cardRef={cardRef}
                  zoomLevel={zoomLevel}
                  renderMode={renderMode}
                  resetScrollTrigger={resetScrollTrigger}
                  onPageCountChange={setPageCount}
                  isMobile={false}
                />
              </div>
            )}

            {/* 右侧：外观参数抽屉 */}
            {showSettings && (
              <div className="w-72 h-full z-10 shrink-0 shadow-lg lg:shadow-none animate-in slide-in-from-right duration-200">
                <SettingsPanel
                  config={config}
                  onChange={setConfig}
                  onReset={() => setConfig(DEFAULT_CONFIG)}
                  renderMode={renderMode}
                  isMobile={false}
                  onClose={() => setShowSettings(false)}
                />
              </div>
            )}
          </>
        )}

        {/* 移动端排版参数抽屉（以优雅的 Bottom Sheet 浮层呈现） */}
        {isMobile && showSettings && (
          <SettingsPanel
            config={config}
            onChange={setConfig}
            onReset={() => setConfig(DEFAULT_CONFIG)}
            renderMode={renderMode}
            isMobile={true}
            onClose={() => setShowSettings(false)}
          />
        )}
      </main>

      {/* 移动端悬浮底栏：纯净轻巧的 [编辑 | 预览] 模式切换胶囊 */}
      {isMobile && (
        <div
          className="fixed bottom-3 inset-x-0 flex justify-center px-4 pointer-events-none pb-[env(safe-area-inset-bottom)]"
          style={{ zIndex: 90 }}
        >
          <nav className="pointer-events-auto flex items-center bg-white/95 backdrop-blur-xl border border-neutral-200/90 shadow-xl rounded-full p-1 text-xs select-none">
            {/* 编辑 Tab */}
            <button
              onClick={() => setMobileTab('editor')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                mobileTab === 'editor'
                  ? 'bg-black text-white font-semibold shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>编辑</span>
            </button>

            {/* 预览 Tab */}
            <button
              onClick={() => setMobileTab('preview')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                mobileTab === 'preview'
                  ? 'bg-black text-white font-semibold shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>预览</span>
              {renderMode === 'paged' && pageCount > 1 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    mobileTab === 'preview'
                      ? 'bg-neutral-800 text-neutral-300'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {pageCount}P
                </span>
              )}
            </button>
          </nav>
        </div>
      )}

      {/* 纯粹聚焦的导出长图弹窗 */}
      <ExportModal
        cardRef={cardRef}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        content={content}
        config={config}
        renderMode={renderMode}
      />

      {/* 关于与致敬浮窗 */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </div>
  );
}
