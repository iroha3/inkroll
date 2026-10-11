import { useState, useRef, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Editor } from './components/Editor';
import { CardPreview } from './components/CardPreview';
import { SettingsPanel } from './components/SettingsPanel';
import { ExportModal } from './components/ExportModal';
import { AboutModal } from './components/AboutModal';
import { CardConfig } from './types';

// localStorage keys for auto-save persistence
const CONTENT_STORAGE_KEY = 'md-card-content';
const CONFIG_STORAGE_KEY = 'md-card-config';

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

// 默认卡片排版配置：默认即是纯正的“松墨黛绿 (Kami Paper) + 衬线体”
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
  theme: 'kami-paper', // 松墨黛绿
  customBgColor: '',
  customTextColor: '',
  fontFamily: 'serif', // 优雅衬线印刷体
  fontSize: 'base',
  lineHeight: 'relaxed',
  showWatermark: true,
  watermarkText: 'By InkRoll',
  watermarkPosition: 'bottom-right',
  canvasBg: 'neutral-gray',
  exportScale: 3,
  exportFormat: 'png',
};

export default function App() {
  // 从 localStorage 恢复，首次访问默认填充极简卡片
  const [content, setContent] = useState<string>(() => {
    try {
      return localStorage.getItem(CONTENT_STORAGE_KEY) ?? DEFAULT_CARD_MARKDOWN;
    } catch {
      return DEFAULT_CARD_MARKDOWN;
    }
  });

  const [config, setConfig] = useState<CardConfig>(() => {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [viewMode, setViewMode] = useState<'split' | 'preview-only' | 'editor-only'>('split');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showSettings, setShowSettings] = useState<boolean>(true);
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
      theme: 'kami-paper',
      fontFamily: 'serif',
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
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch {
      /* storage unavailable */
    }
  }, [config]);

  return (
    <div className="w-screen h-screen flex flex-col bg-neutral-100 overflow-hidden font-sans">
      {/* 顶栏 Navbar */}
      <Navbar
        onExportClick={() => setIsExportModalOpen(true)}
        onAboutClick={() => setIsAboutModalOpen(true)}
        viewMode={viewMode}
        setViewMode={setViewMode}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
      />

      {/* 工作区：分栏收窄 40px，居中留白显著提升 */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* 左侧：Markdown 编辑器 (占比收敛至 32%~35%，释放横向留白) */}
        {(viewMode === 'split' || viewMode === 'editor-only') && (
          <div
            className={`${
              viewMode === 'editor-only' ? 'w-full' : 'w-full lg:w-[35%] xl:w-[32%] min-w-[320px] max-w-[420px]'
            } h-full z-10 transition-all shrink-0`}
          >
            <Editor
              content={content}
              onChange={updateContent}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onResetDefault={handleResetDefault}
              config={config}
            />
          </div>
        )}

        {/* 中间：长图画布预览区 (宽敞舒展、呼吸感充足) */}
        {(viewMode === 'split' || viewMode === 'preview-only') && (
          <div className="flex-1 h-full overflow-hidden relative">
            <CardPreview
              content={content}
              config={config}
              cardRef={cardRef}
              zoomLevel={zoomLevel}
            />
          </div>
        )}

        {/* 右侧：外观参数抽屉 (w-72 紧凑贴合) */}
        {showSettings && (
          <div className="w-72 h-full z-10 shrink-0 shadow-lg lg:shadow-none animate-in slide-in-from-right duration-200">
            <SettingsPanel
              config={config}
              onChange={setConfig}
              onReset={() => setConfig(DEFAULT_CONFIG)}
            />
          </div>
        )}
      </main>

      {/* 纯粹聚焦的导出长图弹窗 */}
      <ExportModal
        cardRef={cardRef}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        content={content}
        config={config}
      />

      {/* 关于与致敬浮窗 */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </div>
  );
}
