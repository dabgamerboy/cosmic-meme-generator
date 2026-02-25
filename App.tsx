
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MEME_TEMPLATES, STYLE_PRESETS, AI_PROVIDERS } from './constants';
import { MemeState, MemeCanvasState, Position, Alignment, MemeFilter, AIConfig } from './types';
import * as aiService from './services/aiService';
import MemeCanvas from './components/MemeCanvas';

const FONTS = [
  { name: 'Impact', value: 'Impact, sans-serif' },
  { name: 'Anton', value: 'Anton, sans-serif' },
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Bebas Neue', value: 'Bebas Neue, sans-serif' },
  { name: 'Roboto Condensed', value: 'Roboto Condensed, sans-serif' },
];

const FILTERS: { name: string; value: MemeFilter; icon: string }[] = [
  { name: 'None', value: 'none', icon: 'fa-ban' },
  { name: 'Grayscale', value: 'grayscale', icon: 'fa-droplet-slash' },
  { name: 'Sepia', value: 'sepia', icon: 'fa-image' },
  { name: 'Invert', value: 'invert', icon: 'fa-circle-half-stroke' },
];

const INITIAL_AI_CONFIG: AIConfig = {
  provider: 'pollinations',
  model: 'openai',
};

const INITIAL_CANVAS_STATE: MemeCanvasState = {
  imageUrl: MEME_TEMPLATES[0].url,
  topText: 'Look at me',
  bottomText: 'I am the captain now',
  topTextPos: { x: 50, y: 15 },
  bottomTextPos: { x: 50, y: 85 },
  topFontSize: 48,
  bottomFontSize: 48,
  topFont: FONTS[0].value,
  bottomFont: FONTS[0].value,
  topAlign: 'center',
  bottomAlign: 'center',
  topTextColor: '#ffffff',
  bottomTextColor: '#ffffff',
  topOutlineColor: '#000000',
  topOutlineWidth: 2,
  bottomOutlineColor: '#000000',
  bottomOutlineWidth: 2,
  topZIndex: 10,
  bottomZIndex: 20,
  imageZIndex: 0,
  topBgColor: '#000000',
  topBgOpacity: 0,
  bottomBgColor: '#000000',
  bottomBgOpacity: 0,
  topBgPadding: 10,
  bottomBgPadding: 10,
  zoom: 1.0,
  pan: { x: 0, y: 0 },
  filter: 'none',
  canvasShadow: true,
  showGrid: false,
};

interface TextBlockProps {
  type: 'top' | 'bottom';
  label: string;
  state: MemeState;
  setState: React.Dispatch<React.SetStateAction<MemeState>>;
  onLayerChange: (target: 'top' | 'bottom' | 'image', action: 'front' | 'back') => void;
}

const TextBlock: React.FC<TextBlockProps> = ({ type, label, state, setState, onLayerChange }) => {
  const isTop = type === 'top';
  const textVal = isTop ? state.topText : state.bottomText;
  const fontVal = isTop ? state.topFont : state.bottomFont;
  const sizeVal = isTop ? state.topFontSize : state.bottomFontSize;
  const alignVal = isTop ? state.topAlign : state.bottomAlign;
  const textColor = isTop ? state.topTextColor : state.bottomTextColor;
  const outlineColor = isTop ? state.topOutlineColor : state.bottomOutlineColor;
  const outlineWidth = isTop ? state.topOutlineWidth : state.bottomOutlineWidth;
  const bgColor = isTop ? state.topBgColor : state.bottomBgColor;
  const bgOpacity = isTop ? state.topBgOpacity : state.bottomBgOpacity;

  return (
    <div className="space-y-3 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
      <div className="flex justify-between items-center mb-1">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
        <div className="flex gap-1">
          {['left', 'center', 'right'].map((a) => (
            <button
              key={a}
              onClick={() => setState(prev => ({ ...prev, [isTop ? 'topAlign' : 'bottomAlign']: a as Alignment }))}
              className={`w-6 h-6 flex items-center justify-center rounded text-[10px] ${alignVal === a ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white bg-slate-900'}`}
            >
              <i className={`fas fa-align-${a}`}></i>
            </button>
          ))}
        </div>
      </div>
      <textarea
        rows={2} value={textVal}
        onChange={(e) => setState(prev => ({ ...prev, [isTop ? 'topText' : 'bottomText']: e.target.value }))}
        className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm resize-none focus:ring-1 focus:ring-indigo-500 outline-none text-white"
        placeholder={`Enter ${label} text...`}
      />
      <div className="grid grid-cols-2 gap-2">
        <select 
          value={fontVal}
          onChange={(e) => setState(prev => ({ ...prev, [isTop ? 'topFont' : 'bottomFont']: e.target.value }))}
          className="bg-slate-900 border border-slate-700 text-[10px] rounded px-2 py-1.5 outline-none text-white"
        >
          {FONTS.map(f => <option key={f.name} value={f.value}>{f.name}</option>)}
        </select>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded px-2">
          <i className="fas fa-text-height text-[10px] text-slate-500"></i>
          <input 
            type="range" min="8" max="150" value={sizeVal}
            onChange={(e) => setState(prev => ({ ...prev, [isTop ? 'topFontSize' : 'bottomFontSize']: parseInt(e.target.value) }))}
            className="flex-1 accent-indigo-500 h-1"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700/30">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
             <span className="text-[8px] font-bold text-slate-500 uppercase">Text & Outline</span>
          </div>
          <div className="flex items-center gap-2">
             <input type="color" value={textColor} onChange={(e) => setState(prev => ({ ...prev, [isTop ? 'topTextColor' : 'bottomTextColor']: e.target.value }))} className="w-4 h-4 rounded-full border-none bg-transparent cursor-pointer p-0" />
             <input type="color" value={outlineColor} onChange={(e) => setState(prev => ({ ...prev, [isTop ? 'topOutlineColor' : 'bottomOutlineColor']: e.target.value }))} className="w-4 h-4 rounded-full border-none bg-transparent cursor-pointer p-0" />
             <input type="range" min="0" max="8" value={outlineWidth} onChange={(e) => setState(prev => ({ ...prev, [isTop ? 'topOutlineWidth' : 'bottomOutlineWidth']: parseInt(e.target.value) }))} className="flex-1 accent-indigo-500 h-1" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
             <span className="text-[8px] font-bold text-slate-500 uppercase">Backing Plate</span>
          </div>
          <div className="flex items-center gap-2">
             <input type="color" value={bgColor} onChange={(e) => setState(prev => ({ ...prev, [isTop ? 'topBgColor' : 'bottomBgColor']: e.target.value }))} className="w-4 h-4 rounded-full border-none bg-transparent cursor-pointer p-0" />
             <input type="range" min="0" max="1" step="0.1" value={bgOpacity} onChange={(e) => setState(prev => ({ ...prev, [isTop ? 'topBgOpacity' : 'bottomBgOpacity']: parseFloat(e.target.value) }))} className="flex-1 accent-indigo-500 h-1" />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-2">
        <span className="text-[9px] font-bold text-slate-600 uppercase">Layer Priority</span>
        <div className="flex gap-1">
          <button onClick={() => onLayerChange(type, 'front')} className="w-6 h-6 bg-slate-900 hover:bg-slate-700 text-slate-500 rounded flex items-center justify-center text-[10px]"><i className="fas fa-layer-group"></i></button>
          <button onClick={() => onLayerChange(type, 'back')} className="w-6 h-6 bg-slate-900 hover:bg-slate-700 text-slate-500 rounded flex items-center justify-center text-[10px]"><i className="fas fa-down-long"></i></button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [state, setState] = useState<MemeState>(() => {
    const savedConfig = localStorage.getItem('cosmic_ai_config');
    return {
      ...INITIAL_CANVAS_STATE,
      isGeneratingCaptions: false,
      isEditingImage: false,
      isAnalyzingColors: false,
      suggestions: [],
      aiConfig: savedConfig ? JSON.parse(savedConfig) : INITIAL_AI_CONFIG
    };
  });

  const [activeTab, setActiveTab] = useState<'edit' | 'ai' | 'assets' | 'settings'>('edit');
  const [aiPrompt, setAiPrompt] = useState('');
  const [past, setPast] = useState<MemeCanvasState[]>([]);
  const [future, setFuture] = useState<MemeCanvasState[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('cosmic_ai_config', JSON.stringify(state.aiConfig));
  }, [state.aiConfig]);

  const commitCurrentState = () => {
    const { isGeneratingCaptions, isEditingImage, isAnalyzingColors, suggestions, aiConfig, ...canvasState } = state;
    setPast(prev => [...prev, canvasState].slice(-50));
    setFuture([]);
  };

  const handleMagicCaption = async () => {
    if (!state.imageUrl) return;
    setState(prev => ({ ...prev, isGeneratingCaptions: true }));
    try {
      const resp = await fetch(state.imageUrl);
      const blob = await resp.blob();
      const reader = new FileReader();
      reader.onloadend = async () => {
        const caps = await aiService.generateCaptions(reader.result as string, state.aiConfig);
        setState(prev => ({ ...prev, suggestions: caps, isGeneratingCaptions: false }));
      };
      reader.readAsDataURL(blob);
    } catch {
      setState(prev => ({ ...prev, isGeneratingCaptions: false }));
    }
  };

  const handleAiEdit = async (customPrompt?: string) => {
    const prompt = customPrompt || aiPrompt;
    if (!prompt) return;
    setState(prev => ({ ...prev, isEditingImage: true }));
    try {
      const resp = await fetch(state.imageUrl!);
      const blob = await resp.blob();
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newUrl = await aiService.generateImage(prompt, state.aiConfig, reader.result as string);
        commitCurrentState();
        setState(prev => ({ ...prev, imageUrl: newUrl, isEditingImage: false }));
        setAiPrompt('');
      };
      reader.readAsDataURL(blob);
    } catch {
      setState(prev => ({ ...prev, isEditingImage: false }));
    }
  };

  const handleLayerAction = (target: 'top' | 'bottom' | 'image', action: 'front' | 'back') => {
    commitCurrentState();
    setState(prev => {
      const zIndices = [prev.topZIndex, prev.bottomZIndex, prev.imageZIndex];
      const maxZ = Math.max(...zIndices);
      const minZ = Math.min(...zIndices);
      const key = target === 'top' ? 'topZIndex' : target === 'bottom' ? 'bottomZIndex' : 'imageZIndex';
      return {
        ...prev,
        [key]: action === 'front' ? maxZ + 1 : minZ - 1
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      commitCurrentState();
      setState(prev => ({ ...prev, imageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const updateAiConfig = (updates: Partial<AIConfig>) => {
    setState(prev => ({ ...prev, aiConfig: { ...prev.aiConfig, ...updates } }));
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="h-14 flex-none border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 w-8 h-8 rounded flex items-center justify-center shadow-lg shadow-indigo-500/20"><i className="fas fa-face-grin-tears"></i></div>
          <h1 className="text-sm font-black tracking-widest uppercase text-indigo-400">COSMIC STUDIO</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-[9px] font-black uppercase text-indigo-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            {AI_PROVIDERS.find(p => p.id === state.aiConfig.provider)?.name}
          </div>
          <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 uppercase tracking-widest">Export</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-16 border-r border-slate-800 bg-slate-900/30 flex flex-col items-center py-6 gap-6 flex-none">
          {[
            { id: 'edit', icon: 'fa-pen-ruler', label: 'Canvas' },
            { id: 'ai', icon: 'fa-wand-magic-sparkles', label: 'AI Lab' },
            { id: 'assets', icon: 'fa-images', label: 'Assets' },
            { id: 'settings', icon: 'fa-gears', label: 'Settings' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`group relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
              title={tab.label}
            >
              <i className={`fas ${tab.icon}`}></i>
            </button>
          ))}
        </aside>

        {/* Viewport */}
        <main className="flex-1 bg-slate-950 p-12 flex flex-col items-center justify-center overflow-auto custom-scrollbar relative">
          {(state.isEditingImage || state.isGeneratingCaptions) && (
            <div className="absolute inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center flex-col gap-4">
              <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Syncing with {state.aiConfig.provider}...</span>
            </div>
          )}
          <div className="max-w-[700px] w-full">
            <MemeCanvas 
              {...state}
              onUpdatePosition={(type, pos) => setState(prev => ({ ...prev, [type === 'top' ? 'topTextPos' : 'bottomTextPos']: pos }))}
              onUpdatePan={(pan) => setState(prev => ({ ...prev, pan }))}
              onUpdateZoom={(zoom) => setState(prev => ({ ...prev, zoom }))}
              onUpdateFontSize={(type, size) => setState(prev => ({ ...prev, [type === 'top' ? 'topFontSize' : 'bottomFontSize']: size }))}
            />
          </div>
        </main>

        {/* Control Panel */}
        <aside className="w-[380px] border-l border-slate-800 bg-slate-900/40 backdrop-blur-sm overflow-y-auto custom-scrollbar flex-none">
          <div className="p-6 space-y-8">
            
            {activeTab === 'edit' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div>
                   <h2 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 mb-4 flex items-center gap-2">
                    <i className="fas fa-font"></i> Typography
                  </h2>
                  <div className="space-y-4">
                    <TextBlock type="top" label="Top Caption" state={state} setState={setState} onLayerChange={handleLayerAction} />
                    <TextBlock type="bottom" label="Bottom Caption" state={state} setState={setState} onLayerChange={handleLayerAction} />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800">
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 mb-4 flex items-center gap-2">
                    <i className="fas fa-wand-sparkles"></i> Visual Effects
                  </h2>
                  <div className="grid grid-cols-4 gap-2">
                    {FILTERS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setState(prev => ({ ...prev, filter: f.value }))}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${state.filter === f.value ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                      >
                        <i className={`fas ${f.icon} text-[10px]`}></i>
                        <span className="text-[8px] font-bold uppercase">{f.name}</span>
                      </button>
                    ))}
                    <button
                        onClick={() => setState(prev => ({ ...prev, canvasShadow: !prev.canvasShadow }))}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${state.canvasShadow ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                      >
                        <i className={`fas fa-moon text-[10px]`}></i>
                        <span className="text-[8px] font-bold uppercase">Shadow</span>
                      </button>
                    <button
                        onClick={() => setState(prev => ({ ...prev, showGrid: !prev.showGrid }))}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${state.showGrid ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                      >
                        <i className={`fas fa-table-cells text-[10px]`}></i>
                        <span className="text-[8px] font-bold uppercase">Grid</span>
                      </button>
                  </div>
                  
                  <div className="mt-6 flex flex-col gap-3 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Background Image</span>
                      <div className="flex gap-1">
                        <button onClick={() => handleLayerAction('image', 'front')} className="w-8 h-8 bg-slate-900 hover:bg-slate-700 text-slate-500 rounded flex items-center justify-center text-[10px]"><i className="fas fa-layer-group"></i></button>
                        <button onClick={() => handleLayerAction('image', 'back')} className="w-8 h-8 bg-slate-900 hover:bg-slate-700 text-slate-500 rounded flex items-center justify-center text-[10px]"><i className="fas fa-down-long"></i></button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Zoom</span>
                      <input 
                        type="range" min="0.5" max="3" step="0.1" value={state.zoom}
                        onChange={(e) => setState(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
                        className="flex-1 accent-indigo-500 h-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-purple-400 mb-4">Magic Captions</h2>
                  <button 
                    onClick={handleMagicCaption}
                    disabled={state.isGeneratingCaptions}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all text-white"
                  >
                    Analyze Image
                  </button>
                  {state.suggestions.length > 0 && (
                    <div className="mt-4 grid gap-2">
                      {state.suggestions.map((s, idx) => (
                        <button key={idx} onClick={() => setState(prev => ({ ...prev, bottomText: s }))} className="text-left text-[11px] p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-purple-500/50 transition-all text-slate-300">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-800">
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 mb-4">Style Studio</h2>
                  <div className="grid grid-cols-3 gap-2">
                    {STYLE_PRESETS.map((s) => (
                      <button key={s.id} onClick={() => handleAiEdit(s.prompt)} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 transition-all group">
                        <i className={`fas ${s.icon} text-slate-500 group-hover:text-emerald-400`}></i>
                        <span className="text-[8px] font-black uppercase text-slate-400">{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800">
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-pink-400 mb-4">Neural Edit</h2>
                  <div className="relative">
                    <input 
                      type="text" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="E.g., Add a space helmet..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-pink-500 text-white"
                    />
                    <button onClick={() => handleAiEdit()} className="absolute right-2 top-2 w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center text-[10px] text-white"><i className="fas fa-arrow-right"></i></button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'assets' && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Templates</h2>
                    <button onClick={() => fileInputRef.current?.click()} className="text-[10px] text-indigo-400 font-black uppercase">Upload My Own</button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                <div className="grid grid-cols-2 gap-3">
                  {MEME_TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => setState(prev => ({ ...prev, imageUrl: t.url }))} className="aspect-square rounded-xl overflow-hidden border-2 border-slate-800 hover:border-indigo-500 transition-all">
                      <img src={t.url} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 mb-4 flex items-center gap-2">
                    <i className="fas fa-microchip"></i> AI Configuration
                  </h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Provider</label>
                      <select 
                        value={state.aiConfig.provider} 
                        onChange={(e) => updateAiConfig({ provider: e.target.value as any, model: AI_PROVIDERS.find(p => p.id === e.target.value)?.models[0] })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                      >
                        {AI_PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Model</label>
                      <select 
                        value={state.aiConfig.model} 
                        onChange={(e) => updateAiConfig({ model: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                      >
                        {AI_PROVIDERS.find(p => p.id === state.aiConfig.provider)?.models.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>

                    {state.aiConfig.provider === 'custom' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Custom Endpoint</label>
                          <input 
                            type="text" 
                            placeholder="https://api.groq.com/v1/chat/completions"
                            value={state.aiConfig.customEndpoint}
                            onChange={(e) => updateAiConfig({ customEndpoint: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">API Key</label>
                          <input 
                            type="password" 
                            placeholder="sk-..."
                            value={state.aiConfig.apiKey}
                            onChange={(e) => updateAiConfig({ apiKey: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-[10px] text-slate-400 leading-relaxed italic">
                  Note: Gemini models are pre-configured with the system API key. Pollinations and AI Horde are free services provided by the community.
                </div>
              </div>
            )}

          </div>
        </aside>
      </div>
    </div>
  );
};

export default App;
