import { useState, useRef, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Editor } from './components/Editor';
import { CardPreview } from './components/CardPreview';
import { SettingsPanel } from './components/SettingsPanel';
import { ExportModal } from './components/ExportModal';
import { CardConfig } from './types';
import { TEMPLATE_PRESETS, DEFAULT_MARKDOWN_IMAGE_TEST } from './constants/templates';
import { renderElementToImageData } from './utils/exportImage';

// localStorage keys for auto-save persistence
const CONTENT_STORAGE_KEY = 'md-card-content';
const CONFIG_STORAGE_KEY = 'md-card-config';
const PRESET_STORAGE_KEY = 'md-card-preset';

// Default configuration matching user's reference image style 100%
const DEFAULT_CONFIG: CardConfig = {
  showTitle: false,
  titleText: '',
  showRoleBadges: true,
  userBadgeText: 'User',
  userBadgeIcon: '👨‍💻',
  assistantBadgeText: 'Assistant',
  assistantBadgeIcon: '🤖',
  cardWidth: 500,
  padding: 'normal',
  borderRadius: 12,
  theme: 'classic-white',
  customBgColor: '',
  customTextColor: '',
  fontFamily: 'sans',
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
  // Lazy-init from localStorage so work survives reloads
  const [content, setContent] = useState<string>(() => {
    try {
      return localStorage.getItem(CONTENT_STORAGE_KEY) ?? DEFAULT_MARKDOWN_IMAGE_TEST;
    } catch {
      return DEFAULT_MARKDOWN_IMAGE_TEST;
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
  // Which template preset is currently selected (persisted so the dropdown
  // stays in sync with restored content after a reload)
  const [activePresetId, setActivePresetId] = useState<string>(() => {
    try {
      return localStorage.getItem(PRESET_STORAGE_KEY) ?? 'conversation-exact';
    } catch {
      return 'conversation-exact';
    }
  });

  const cardRef = useRef<HTMLDivElement>(null);

  // Undo/redo history. React controlled textareas don't keep a native undo
  // stack, and programmatic edits (toolbar, presets) never touch it, so we
  // maintain our own. History side-effects run outside the state updater
  // (StrictMode double-invokes updaters in dev) via a ref mirror of content.
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
    // Merge rapid consecutive edits (typing): keep the original snapshot so
    // one undo step rewinds the whole burst, not a single keystroke.
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
  useEffect(() => {
    try {
      localStorage.setItem(PRESET_STORAGE_KEY, activePresetId);
    } catch {
      /* storage unavailable */
    }
  }, [activePresetId]);

  // Apply Preset
  const handleApplyPreset = (presetId: string) => {
    const preset = TEMPLATE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      updateContent(preset.content);
      setConfig((prev) => ({
        ...prev,
        ...preset.config,
      }));
      setActivePresetId(presetId);
    }
  };

  // Reset Configuration
  const handleResetSettings = () => {
    setConfig(DEFAULT_CONFIG);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-neutral-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <Navbar
        onExportClick={() => setIsExportModalOpen(true)}
        viewMode={viewMode}
        setViewMode={setViewMode}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Column: Markdown Editor */}
        {(viewMode === 'split' || viewMode === 'editor-only') && (
          <div
            className={`${
              viewMode === 'editor-only' ? 'w-full' : 'w-full lg:w-1/2 xl:w-[45%]'
            } h-full z-10 transition-all`}
          >
            <Editor
              content={content}
              onChange={updateContent}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onApplyPreset={handleApplyPreset}
              activePresetId={activePresetId}
              config={config}
            />
          </div>
        )}

        {/* Center Column: Card Preview Canvas */}
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

        {/* Right Column: Settings Drawer / Panel */}
        {showSettings && (
          <div className="w-80 h-full z-10 shrink-0 shadow-lg lg:shadow-none animate-in slide-in-from-right duration-200">
            <SettingsPanel
              config={config}
              onChange={setConfig}
              onReset={handleResetSettings}
            />
          </div>
        )}
      </main>

      {/* High-Res Image Export Modal */}
      <ExportModal
        cardRef={cardRef}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
