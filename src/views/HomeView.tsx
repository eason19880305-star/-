import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Image as ImageIcon, Layers, Settings2, BookOpen, Edit3, Eye, SlidersHorizontal, ChevronLeft, ChevronRight, Upload, Type, Palette, AlignLeft, AlignCenter, AlignJustify, Layout } from 'lucide-react';
import { exportToShortImages } from '../utils/exportImage';

interface PageParagraph {
  text: string;
  isContinuation: boolean;
}

export default function HomeView() {
  const [title, setTitle] = useState('记忆碎片');
  const [author, setAuthor] = useState('匿名作者');
  const [content, setContent] = useState('在深海的深处，藏着无数被遗忘的记忆碎片。\\n\\n它们像星星一样闪烁，等待着有缘人将它们拾起。每一片记忆，都承载着一个独特的故事，一段难以忘怀的情感。\\n\\n当你闭上眼睛，倾听海浪的声音，也许你能听到那些记忆在低语。');
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'design' | 'preview'>('preview');

  type LayoutPreset = 'classic' | 'vertical-title' | 'modern' | 'brutalist';
  const [layoutPreset, setLayoutPreset] = useState<LayoutPreset>('classic');

  // Custom typography states
  const [fontSize, setFontSize] = useState(18);
  const [titleFontSize, setTitleFontSize] = useState(32);
  const [authorFontSize, setAuthorFontSize] = useState(16);
  const [fontWeight, setFontWeight] = useState(400);
  const [titleFontWeight, setTitleFontWeight] = useState(700);
  const [lineHeight, setLineHeight] = useState(2.2);
  const [letterSpacing, setLetterSpacing] = useState(0);
  
  // Layout states
  const [aspectRatio, setAspectRatio] = useState<'3:4' | '9:16' | '1:1' | '4:5' | 'A4'>('3:4');
  const [paddingRatio, setPaddingRatio] = useState(10); // 10% default
  
  // Advanced styling states
  const [customFontFamily, setCustomFontFamily] = useState<string>('');
  const [customFontFileName, setCustomFontFileName] = useState<string>('');
  const [customTextColor, setCustomTextColor] = useState<string>('');
  const [customBgColor, setCustomBgColor] = useState<string>('');
  const [textAlign, setTextAlign] = useState<'justify' | 'left' | 'center'>('justify');
  const [paragraphIndent, setParagraphIndent] = useState<boolean>(true);
  
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [previewScale, setPreviewScale] = useState(0.3333);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // --- Precise Pagination Logic ---
  let CANVAS_W = 1200;
  let CANVAS_H = 1600;
  switch (aspectRatio) {
    case '9:16': CANVAS_W = 1080; CANVAS_H = 1920; break;
    case '1:1': CANVAS_W = 1200; CANVAS_H = 1200; break;
    case '4:5': CANVAS_W = 1200; CANVAS_H = 1500; break;
    case 'A4': CANVAS_W = 1240; CANVAS_H = 1754; break;
    case '3:4': default: CANVAS_W = 1200; CANVAS_H = 1600; break;
  }
  
  const PADDING_X = Math.floor(CANVAS_W * (paddingRatio / 100));
  const PADDING_Y = Math.floor(CANVAS_H * (paddingRatio / 100));
  const CONTENT_W = CANVAS_W - PADDING_X * 2;
  
  const f = fontSize * 3; // Scale factor 3 for 1200x1600
  const lh = f * lineHeight;
  // Calculate exact characters per line, subtract 0.5 for safety margin (punctuation, etc.)
  const cpl = Math.max(1, Math.floor(CONTENT_W / (f + letterSpacing * 3)) - 0.5);
  
  const titleSize = titleFontSize * 3;
  const authorSize = authorFontSize * 3;
  const titleMargin = f;
  const authorMargin = f * 2;
  const dividerMargin = f * 2;
  
  // Rough estimate of header DOM height (Title + Author + Divider + margins)
  const headerHeight = titleSize * 1.5 + titleMargin + authorSize * 1.5 + authorMargin + dividerMargin + 40; 
  const footerHeight = 0; // Footer is placed inside the bottom padding
  const paragraphGap = 32;
  
  const availableHeightFirstPage = CANVAS_H - PADDING_Y * 2 - headerHeight;
  const availableHeightOtherPages = CANVAS_H - PADDING_Y * 2;
  
  const pages: PageParagraph[][] = [];
  let currentPage: PageParagraph[] = [];
  let currentHeight = 0;
  
  const paragraphs = content.split('\n').filter(p => p.trim());
  
  for (let i = 0; i < paragraphs.length; i++) {
    let remainingText = paragraphs[i].trim();
    let isContinuation = false;
    
    while (remainingText.length > 0) {
      const isFirstPage = pages.length === 0;
      const maxPageHeight = isFirstPage ? availableHeightFirstPage : availableHeightOtherPages;
      
      const gap = (currentPage.length > 0) ? paragraphGap : 0;
      const remainingHeight = maxPageHeight - currentHeight - gap;
      const possibleLines = Math.floor(remainingHeight / lh);
      
      if (possibleLines <= 0) {
        pages.push(currentPage);
        currentPage = [];
        currentHeight = 0;
        continue;
      }
      
      const indentChars = !isContinuation ? 2 : 0;
      const maxChars = Math.floor(possibleLines * cpl) - indentChars;
      
      if (remainingText.length <= maxChars) {
        currentPage.push({ text: remainingText, isContinuation });
        const actualLines = Math.ceil((remainingText.length + indentChars) / cpl);
        currentHeight += gap + (actualLines * lh);
        remainingText = '';
      } else {
        let sliceIndex = maxChars;
        if (sliceIndex <= 0) {
           pages.push(currentPage);
           currentPage = [];
           currentHeight = 0;
           continue;
        }
        const chunk = remainingText.substring(0, sliceIndex);
        currentPage.push({ text: chunk, isContinuation });
        
        pages.push(currentPage);
        currentPage = [];
        currentHeight = 0;
        
        remainingText = remainingText.substring(sliceIndex);
        isContinuation = true;
      }
    }
  }
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }
  if (pages.length === 0) pages.push([{ text: '', isContinuation: false }]);

  // Ensure currentPageIndex is valid
  if (currentPageIndex >= pages.length) {
    setCurrentPageIndex(Math.max(0, pages.length - 1));
  }

  // Update preview scale based on container width
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setPreviewScale(entries[0].contentRect.width / CANVAS_W);
      }
    });
    if (previewContainerRef.current) {
      observer.observe(previewContainerRef.current);
    }
    return () => observer.disconnect();
  }, [CANVAS_W, CANVAS_H]);

  const handleExportShortImages = async () => {
    setIsExporting(true);
    try {
      await exportToShortImages(pages.length, title || '短图导出');
    } catch (error) {
      console.error('导出短图失败', error);
      alert('导出短图失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fontUrl = URL.createObjectURL(file);
    const fontName = `CustomFont_${Date.now()}`;

    const newStyle = document.createElement('style');
    newStyle.appendChild(document.createTextNode(`
      @font-face {
        font-family: '${fontName}';
        src: url('${fontUrl}');
      }
    `));
    document.head.appendChild(newStyle);

    setCustomFontFamily(fontName);
    setCustomFontFileName(file.name);
  };

  const renderPageContent = (page: PageParagraph[], idx: number) => {
    const isFirstPage = idx === 0;
    
    if (layoutPreset === 'vertical-title') {
      return (
        <div className="flex-1 flex flex-row-reverse relative z-10 h-full">
          {isFirstPage && (
            <div className="shrink-0 flex flex-col items-center justify-start ml-12" style={{ writingMode: 'vertical-rl' }}>
              <h1 className="font-bold tracking-[0.15em]" style={{ fontSize: `${titleSize}px`, color: customTextColor || undefined, fontFamily: customFontFamily || undefined, fontWeight: titleFontWeight }}>{title || '未命名作品'}</h1>
              <div className="tracking-widest opacity-80 mt-8" style={{ fontSize: `${authorSize}px`, color: customTextColor || undefined, fontFamily: customFontFamily || undefined, fontWeight }}>{author ? `作者：${author}` : ''}</div>
              <div className="flex items-center justify-center opacity-30 mt-8">
                <div className="h-12 border-l border-current"></div>
              </div>
            </div>
          )}
          <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', justifyContent: isFirstPage ? 'flex-start' : 'center', gap: `${paragraphGap}px` }}>
            {page.map((p, i) => (
              <p 
                key={i} 
                className="leading-[2.2] text-justify space-y-6"
                style={{ 
                  fontSize: `${f}px`, 
                  lineHeight: lineHeight, 
                  letterSpacing: `${letterSpacing * 3}px`,
                  textIndent: (p.isContinuation || !paragraphIndent || textAlign === 'center') ? '0' : '2em',
                  margin: 0,
                  color: customTextColor || undefined,
                  fontFamily: customFontFamily || undefined,
                  textAlign,
                  fontWeight
                }}
              >
                {p.text}
              </p>
            ))}
          </div>
        </div>
      );
    }

    if (layoutPreset === 'modern') {
      return (
        <div className="flex-1 flex flex-col relative z-10 h-full">
          {isFirstPage && (
            <div className="shrink-0 mb-16 text-left">
              <h1 className="font-black tracking-tight leading-tight" style={{ fontSize: `${titleSize * 1.2}px`, marginBottom: `${titleMargin * 0.5}px`, color: customTextColor || undefined, fontFamily: customFontFamily || undefined, fontWeight: 900 }}>{title || '未命名作品'}</h1>
              <div className="tracking-wider opacity-60 font-medium" style={{ fontSize: `${authorSize}px`, marginBottom: `${authorMargin}px`, color: customTextColor || undefined, fontFamily: customFontFamily || undefined, fontWeight }}>{author ? `BY ${author}` : ''}</div>
            </div>
          )}
          <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', justifyContent: isFirstPage ? 'flex-start' : 'center', gap: `${paragraphGap}px` }}>
            {page.map((p, i) => (
              <p 
                key={i} 
                className="leading-[2.0] text-left space-y-6"
                style={{ 
                  fontSize: `${f}px`, 
                  lineHeight: lineHeight, 
                  letterSpacing: `${letterSpacing * 2}px`,
                  textIndent: '0',
                  margin: 0,
                  color: customTextColor || undefined,
                  fontFamily: customFontFamily || undefined,
                  textAlign: 'left',
                  fontWeight
                }}
              >
                {p.text}
              </p>
            ))}
          </div>
        </div>
      );
    }

    if (layoutPreset === 'brutalist') {
      return (
        <div className="flex-1 flex flex-col relative z-10 h-full">
          {isFirstPage && (
            <div className="shrink-0 mb-12 border-b-4 border-current pb-8">
              <h1 className="font-black uppercase tracking-tighter leading-none" style={{ fontSize: `${titleSize * 1.5}px`, marginBottom: `${titleMargin * 0.5}px`, color: customTextColor || undefined, fontFamily: customFontFamily || undefined, textAlign: 'left', fontWeight: 900 }}>{title || '未命名作品'}</h1>
              <div className="tracking-widest opacity-100 font-bold uppercase" style={{ fontSize: `${authorSize * 1.2}px`, color: customTextColor || undefined, fontFamily: customFontFamily || undefined, textAlign: 'left', fontWeight: 700 }}>{author ? `${author}` : ''}</div>
            </div>
          )}
          <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', justifyContent: isFirstPage ? 'flex-start' : 'center', gap: `${paragraphGap}px` }}>
            {page.map((p, i) => (
              <p 
                key={i} 
                className="leading-[1.8] text-left space-y-6 font-medium"
                style={{ 
                  fontSize: `${f}px`, 
                  lineHeight: lineHeight * 0.8, 
                  letterSpacing: `${letterSpacing * 1}px`,
                  textIndent: '0',
                  margin: 0,
                  color: customTextColor || undefined,
                  fontFamily: customFontFamily || undefined,
                  textAlign: 'left',
                  fontWeight: 500
                }}
              >
                {p.text}
              </p>
            ))}
          </div>
        </div>
      );
    }

    // classic (default)
    return (
      <div className="flex-1 flex flex-col relative z-10 h-full">
        {isFirstPage && (
          <div className="shrink-0">
            <h1 className="font-bold text-center tracking-[0.15em]" style={{ fontSize: `${titleSize}px`, marginBottom: `${titleMargin}px`, color: customTextColor || undefined, fontFamily: customFontFamily || undefined, textAlign, fontWeight: titleFontWeight }}>{title || '未命名作品'}</h1>
            <div className="text-center tracking-widest opacity-80" style={{ fontSize: `${authorSize}px`, marginBottom: `${authorMargin}px`, color: customTextColor || undefined, fontFamily: customFontFamily || undefined, textAlign, fontWeight }}>{author ? `作者：${author}` : ''}</div>
            <div className="flex items-center justify-center opacity-30" style={{ marginBottom: `${dividerMargin}px` }}>
              <div className="w-12 border-t border-current"></div>
              <div className="w-1.5 h-1.5 rotate-45 bg-current mx-2"></div>
              <div className="w-12 border-t border-current"></div>
            </div>
          </div>
        )}
        <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', justifyContent: isFirstPage ? 'flex-start' : 'center', gap: `${paragraphGap}px` }}>
          {page.map((p, i) => (
            <p 
              key={i} 
              className="leading-[2.2] text-justify space-y-6"
              style={{ 
                fontSize: `${f}px`, 
                lineHeight: lineHeight, 
                letterSpacing: `${letterSpacing * 3}px`,
                textIndent: (p.isContinuation || !paragraphIndent || textAlign === 'center') ? '0' : '2em',
                margin: 0,
                color: customTextColor || undefined,
                fontFamily: customFontFamily || undefined,
                textAlign,
                fontWeight
              }}
            >
              {p.text}
            </p>
          ))}
        </div>
      </div>
    );
  };

  const renderFrame = () => {
    if (layoutPreset === 'classic') {
      return <div className="absolute inset-0 pointer-events-none" style={{ border: `1px solid currentColor`, opacity: 0.15, margin: `${PADDING_X * 0.4}px` }}></div>;
    }
    if (layoutPreset === 'vertical-title') {
      return <div className="absolute inset-0 pointer-events-none" style={{ border: `1px solid currentColor`, opacity: 0.2, margin: `${PADDING_X * 0.6}px`, borderLeft: 'none', borderRight: 'none' }}></div>;
    }
    if (layoutPreset === 'brutalist') {
      return <div className="absolute inset-0 pointer-events-none" style={{ border: `4px solid currentColor`, opacity: 1, margin: `${PADDING_X * 0.5}px` }}></div>;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Tabs */}
      <div className="md:hidden flex border-b border-slate-200 bg-white sticky top-0 z-20">
        <button 
          onClick={() => setActiveTab('edit')}
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'edit' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
        >
          <Edit3 className="w-4 h-4" /> 内容
        </button>
        <button 
          onClick={() => setActiveTab('design')}
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'design' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
        >
          <Settings2 className="w-4 h-4" /> 排版
        </button>
        <button 
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'preview' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
        >
          <Eye className="w-4 h-4" /> 预览
        </button>
      </div>

      {/* Left Panel: Controls (Hidden on mobile unless active) */}
      <div className={`w-full md:w-[360px] lg:w-[400px] bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-53px)] md:h-screen shadow-sm z-10 ${activeTab === 'preview' ? 'hidden md:flex' : 'flex'}`}>
        
        <div className="hidden md:flex items-center gap-3 p-6 pb-4 border-b border-slate-100">
          <BookOpen className="w-7 h-7 text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">书韵排版</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Content Edit Section */}
          <div className={`space-y-4 ${activeTab === 'design' ? 'hidden md:block' : 'block'}`}>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Edit3 className="w-4 h-4 text-slate-400" /> 文本内容
            </h2>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">作品标题</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-800"
                placeholder="输入标题..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">作者名称</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-800"
                placeholder="输入作者..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">正文内容</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-800 h-48 resize-none"
                placeholder="在此输入您的长篇文字..."
              />
            </div>
          </div>

          {/* Design Section */}
          <div className={`space-y-6 ${activeTab === 'edit' ? 'hidden md:block' : 'block'}`}>
            <div className="pt-2">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Layout className="w-4 h-4 text-slate-400" /> 排版预设
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'classic', name: '古典画框', desc: '居中对齐，带艺术内边框' },
                  { id: 'vertical-title', name: '竖版标题', desc: '标题竖排，传统东方美学' },
                  { id: 'modern', name: '现代极简', desc: '左对齐，大面积留白' },
                  { id: 'brutalist', name: '先锋主义', desc: '粗犷线条，强对比排版' },
                ].map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => setLayoutPreset(preset.id as LayoutPreset)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      layoutPreset === preset.id
                        ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                        : 'border-slate-100 bg-white hover:border-indigo-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-medium text-slate-800 mb-1 text-sm">{preset.name}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
                <SlidersHorizontal className="w-4 h-4 text-slate-400" /> 自定义微调
              </h2>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-medium text-slate-600">画布比例</label>
                  </div>
                  <select 
                    value={aspectRatio} 
                    onChange={(e) => setAspectRatio(e.target.value as any)}
                    className="w-full p-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="3:4">3:4 (小红书/标准)</option>
                    <option value="9:16">9:16 (手机全屏)</option>
                    <option value="4:5">4:5 (社交媒体)</option>
                    <option value="1:1">1:1 (正方形)</option>
                    <option value="A4">A4 (打印/文档)</option>
                  </select>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-medium text-slate-600">留白大小</label>
                    <span className="text-xs text-slate-400">{paddingRatio}%</span>
                  </div>
                  <input type="range" min="5" max="25" step="1" value={paddingRatio} onChange={(e) => setPaddingRatio(Number(e.target.value))} className="w-full accent-indigo-600" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-medium text-slate-600">正文字号</label>
                    <span className="text-xs text-slate-400">{fontSize}px</span>
                  </div>
                  <input type="range" min="12" max="32" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-indigo-600" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs font-medium text-slate-600">标题字号</label>
                      <span className="text-xs text-slate-400">{titleFontSize}px</span>
                    </div>
                    <input type="range" min="20" max="60" value={titleFontSize} onChange={(e) => setTitleFontSize(Number(e.target.value))} className="w-full accent-indigo-600" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs font-medium text-slate-600">作者字号</label>
                      <span className="text-xs text-slate-400">{authorFontSize}px</span>
                    </div>
                    <input type="range" min="12" max="30" value={authorFontSize} onChange={(e) => setAuthorFontSize(Number(e.target.value))} className="w-full accent-indigo-600" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs font-medium text-slate-600">标题粗细</label>
                      <span className="text-xs text-slate-400">{titleFontWeight}</span>
                    </div>
                    <input type="range" min="100" max="900" step="100" value={titleFontWeight} onChange={(e) => setTitleFontWeight(Number(e.target.value))} className="w-full accent-indigo-600" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs font-medium text-slate-600">正文粗细</label>
                      <span className="text-xs text-slate-400">{fontWeight}</span>
                    </div>
                    <input type="range" min="100" max="900" step="100" value={fontWeight} onChange={(e) => setFontWeight(Number(e.target.value))} className="w-full accent-indigo-600" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-medium text-slate-600">段落行距</label>
                    <span className="text-xs text-slate-400">{lineHeight}</span>
                  </div>
                  <input type="range" min="1.5" max="3.0" step="0.1" value={lineHeight} onChange={(e) => setLineHeight(Number(e.target.value))} className="w-full accent-indigo-600" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-medium text-slate-600">字间距</label>
                    <span className="text-xs text-slate-400">{letterSpacing}px</span>
                  </div>
                  <input type="range" min="0" max="10" step="0.5" value={letterSpacing} onChange={(e) => setLetterSpacing(Number(e.target.value))} className="w-full accent-indigo-600" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Palette className="w-4 h-4 text-slate-400" /> 颜色与字体
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-2">自定义字体</label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                      <Upload className="w-4 h-4 text-slate-500" />
                      <span className="text-xs text-slate-600 truncate">{customFontFileName || '上传字体文件 (.ttf, .otf)'}</span>
                      <input type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={handleFontUpload} />
                    </label>
                    {customFontFamily && (
                      <button onClick={() => { setCustomFontFamily(''); setCustomFontFileName(''); }} className="p-2 text-xs text-red-500 hover:bg-red-50 rounded-lg">
                        清除
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-2">文字颜色</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={customTextColor || '#000000'} 
                        onChange={(e) => setCustomTextColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                      />
                      {customTextColor && (
                        <button onClick={() => setCustomTextColor('')} className="text-xs text-slate-500 hover:text-slate-800">重置</button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-2">背景颜色</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={customBgColor || '#ffffff'} 
                        onChange={(e) => setCustomBgColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                      />
                      {customBgColor && (
                        <button onClick={() => setCustomBgColor('')} className="text-xs text-slate-500 hover:text-slate-800">重置</button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-2">对齐方式</label>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                      onClick={() => setTextAlign('left')}
                      className={`flex-1 flex justify-center py-1.5 rounded-md transition-colors ${textAlign === 'left' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setTextAlign('center')}
                      className={`flex-1 flex justify-center py-1.5 rounded-md transition-colors ${textAlign === 'center' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setTextAlign('justify')}
                      className={`flex-1 flex justify-center py-1.5 rounded-md transition-colors ${textAlign === 'justify' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <AlignJustify className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-600">首行缩进 (2字符)</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={paragraphIndent} onChange={(e) => setParagraphIndent(e.target.checked)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export Actions */}
        <div className={`p-6 border-t border-slate-100 bg-white space-y-3 ${activeTab === 'preview' ? 'hidden md:block' : 'block'}`}>
          <button
            onClick={handleExportShortImages}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-sm text-sm tracking-widest"
          >
            <Layers className="w-4 h-4" /> 导出分页短图
          </button>
        </div>
      </div>

      {/* Right Panel: Preview */}
      <div className={`flex-1 bg-slate-100/50 p-4 md:p-8 overflow-y-auto flex flex-col items-center ${activeTab !== 'preview' ? 'hidden md:flex' : 'flex'}`}>
        
        <div className="w-full max-w-[400px] mb-4 flex justify-between items-center text-slate-500 text-xs md:text-sm px-2">
          <span>实时预览 (3:4 比例)</span>
          <span>{content.length} 字 / {pages.length} 页</span>
        </div>
        
        {/* The Preview Canvas */}
        <div 
          ref={previewContainerRef}
          className="w-full max-w-[400px] relative shadow-2xl overflow-hidden bg-white transition-all duration-300"
          style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
        >
          <div 
            className={`absolute top-0 left-0 origin-top-left flex flex-col bg-[#F9F8F6] text-[#2C2A28] font-serif`}
            style={{ 
              width: `${CANVAS_W}px`, 
              height: `${CANVAS_H}px`, 
              transform: `scale(${previewScale})`,
              padding: `${PADDING_Y}px ${PADDING_X}px`,
              backgroundColor: customBgColor || undefined,
              color: customTextColor || undefined,
              fontFamily: customFontFamily || undefined
            }}
          >
            {renderFrame()}
            {pages[currentPageIndex] && renderPageContent(pages[currentPageIndex], currentPageIndex)}
            
            <div className="absolute left-0 right-0 text-center opacity-30 font-sans tracking-widest shrink-0 z-10" style={{ bottom: `${PADDING_Y / 2}px`, fontSize: `${f * 0.6}px`, transform: 'translateY(50%)', color: customTextColor || undefined }}>
              - {currentPageIndex + 1} / {pages.length} -
            </div>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-6 mt-8">
          <button 
            onClick={() => setCurrentPageIndex(p => Math.max(0, p - 1))}
            disabled={currentPageIndex === 0}
            className="p-2 rounded-full hover:bg-slate-200 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-slate-700" />
          </button>
          <span className="text-sm font-medium text-slate-600 tracking-widest">
            {currentPageIndex + 1} / {pages.length}
          </span>
          <button 
            onClick={() => setCurrentPageIndex(p => Math.min(pages.length - 1, p + 1))}
            disabled={currentPageIndex === pages.length - 1}
            className="p-2 rounded-full hover:bg-slate-200 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-slate-700" />
          </button>
        </div>
        
        {/* Mobile Export Buttons in Preview Tab */}
        <div className="md:hidden mt-6 space-y-3 pb-8 w-full max-w-[400px]">
          <button
            onClick={handleExportShortImages}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-sm text-sm tracking-widest"
          >
            <Layers className="w-4 h-4" /> 导出分页短图
          </button>
        </div>
      </div>

      {/* Hidden Export Containers */}
      <div className="fixed top-0 left-[-9999px] opacity-0 pointer-events-none z-[-1]">
        {/* Short Images */}
        {pages.map((page, idx) => (
          <div 
            key={`export-${idx}`} 
            id={`export-page-${idx}`} 
            className={`flex flex-col relative overflow-hidden bg-[#F9F8F6] text-[#2C2A28] font-serif`}
            style={{ 
              width: `${CANVAS_W}px`, 
              height: `${CANVAS_H}px`, 
              padding: `${PADDING_Y}px ${PADDING_X}px`,
              backgroundColor: customBgColor || undefined,
              color: customTextColor || undefined,
              fontFamily: customFontFamily || undefined
            }}
          >
            {renderFrame()}
            {renderPageContent(page, idx)}
            <div className="absolute left-0 right-0 text-center opacity-30 font-sans tracking-widest shrink-0 z-10" style={{ bottom: `${PADDING_Y / 2}px`, fontSize: `${f * 0.6}px`, transform: 'translateY(50%)', color: customTextColor || undefined }}>
              - {idx + 1} / {pages.length} -
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
