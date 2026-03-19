import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, FileText, Image as ImageIcon, Layers, Settings2, BookOpen, Edit3, Eye, SlidersHorizontal, ChevronLeft, ChevronRight, Upload, Type, Palette, AlignLeft, AlignCenter, AlignJustify, Layout, Menu, X } from 'lucide-react';
import { exportToShortImages } from '../utils/exportImage';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';

interface PageParagraph {
  text: string;
  isContinuation: boolean;
}

export default function HomeView() {
  const [title, setTitle] = useState('记忆碎片');
  const [author, setAuthor] = useState('岁岁');
  const [content, setContent] = useState('在深海的深处，藏着无数被遗忘的记忆碎片。它们像星星一样闪烁，等待着有缘人将它们拾起。每一片记忆，都承载着一个独特的故事，一段难以忘怀的情感。当你闭上眼睛，倾听海浪的声音，也许你能听到那些记忆在低语。');
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'design'>('edit');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(420);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [userZoom, setUserZoom] = useState(1);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingSidebar) return;
      const newWidth = Math.max(320, Math.min(800, e.clientX));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      setIsResizingSidebar(false);
    };

    if (isResizingSidebar) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar]);

  type LayoutPreset = 'classic' | 'vertical-title' | 'modern' | 'brutalist';
  const [layoutPreset, setLayoutPreset] = useState<LayoutPreset>('classic');

  type PageNumberStyle = 'none' | 'classic' | 'minimal' | 'slash' | 'line' | 'box';
  const [pageNumberStyle, setPageNumberStyle] = useState<PageNumberStyle>('classic');

  type PageNumberPosition = 'left' | 'center' | 'right';
  const [pageNumberPosition, setPageNumberPosition] = useState<PageNumberPosition>('center');

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
  const [customBgImage, setCustomBgImage] = useState<string>('');
  const [customBgImageFileName, setCustomBgImageFileName] = useState<string>('');
  const [textAlign, setTextAlign] = useState<'justify' | 'left' | 'center'>('justify');
  const [paragraphIndent, setParagraphIndent] = useState<boolean>(true);
  
  // Cropper states
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [previewScale, setPreviewScale] = useState(0.3333);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const sliderEvents = {
    onPointerDown: () => setIsDraggingSlider(true),
    onPointerUp: () => setIsDraggingSlider(false),
    onPointerCancel: () => setIsDraggingSlider(false),
    onTouchStart: () => setIsDraggingSlider(true),
    onTouchEnd: () => setIsDraggingSlider(false),
  };

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

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setRawImageSrc(event.target.result as string);
        setCustomBgImageFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset input
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!rawImageSrc || !croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(rawImageSrc, croppedAreaPixels);
      if (croppedImage) {
        setCustomBgImage(croppedImage);
        setRawImageSrc(null); // close modal
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renderPageContent = (page: PageParagraph[], idx: number) => {
    const isFirstPage = idx === 0;
    
    if (layoutPreset === 'vertical-title') {
      return (
        <div className="flex-1 flex flex-row-reverse relative z-10 h-full">
          {isFirstPage && (
            <div className="shrink-0 flex flex-col items-center justify-start ml-12" style={{ writingMode: 'vertical-rl' }}>
              <h1 className="font-bold tracking-[0.15em]" style={{ fontSize: `${titleSize}px`, color: customTextColor || undefined, fontFamily: customFontFamily || undefined, fontWeight: titleFontWeight }}>{title || '未命名作品'}</h1>
              <div className="tracking-widest opacity-80 mt-8" style={{ fontSize: `${authorSize}px`, color: customTextColor || undefined, fontFamily: customFontFamily || undefined, fontWeight }}>{author ? `${author}` : ''}</div>
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
            <div className="text-center tracking-widest opacity-80" style={{ fontSize: `${authorSize}px`, marginBottom: `${authorMargin}px`, color: customTextColor || undefined, fontFamily: customFontFamily || undefined, textAlign, fontWeight }}>{author ? `${author}` : ''}</div>
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
      return <div className="absolute inset-0 pointer-events-none" style={{ borderTop: `1px solid currentColor`, borderBottom: `1px solid currentColor`, opacity: 0.2, margin: `${PADDING_X * 0.6}px` }}></div>;
    }
    if (layoutPreset === 'brutalist') {
      return <div className="absolute inset-0 pointer-events-none" style={{ border: `4px solid currentColor`, opacity: 1, margin: `${PADDING_X * 0.5}px` }}></div>;
    }
    return null;
  };

  const renderPageNumberIndicator = (idx: number, total: number) => {
    if (pageNumberStyle === 'none') return null;
    
    let content = null;
    switch (pageNumberStyle) {
      case 'classic':
        content = `- ${idx + 1} / ${total} -`;
        break;
      case 'minimal':
        content = `${idx + 1}`;
        break;
      case 'slash':
        content = `${idx + 1} / ${total}`;
        break;
      case 'line':
        content = (
          <div className="flex items-center justify-center gap-4">
            <div className="w-8 h-[1px] bg-current opacity-50"></div>
            <span>{idx + 1}</span>
            <div className="w-8 h-[1px] bg-current opacity-50"></div>
          </div>
        );
        break;
      case 'box':
        content = (
          <div className="inline-flex items-center justify-center border border-current px-3 py-1 rounded-sm">
            {idx + 1} / {total}
          </div>
        );
        break;
    }

    return (
      <div 
        className={`absolute left-0 right-0 flex opacity-30 font-sans tracking-widest shrink-0 z-10 ${
          pageNumberPosition === 'center' ? 'justify-center' :
          pageNumberPosition === 'left' ? 'justify-start' :
          'justify-end'
        }`} 
        style={{ 
          bottom: `${PADDING_Y / 2}px`, 
          paddingLeft: pageNumberPosition === 'left' ? `${PADDING_X}px` : 0,
          paddingRight: pageNumberPosition === 'right' ? `${PADDING_X}px` : 0,
          fontSize: `${f * 0.6}px`, 
          transform: 'translateY(50%)', 
          color: customTextColor || undefined 
        }}
      >
        {content}
      </div>
    );
  };

  return (
    <div className="h-screen bg-[#F9F9F9] flex font-sans text-neutral-900 overflow-hidden relative">
      
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ${isDraggingSlider ? 'bg-transparent pointer-events-none' : 'bg-black/40 backdrop-blur-sm'}`}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Panel: Controls (Sidebar) */}
      <div 
        className={`fixed md:static inset-y-0 left-0 z-50 bg-white border-r border-neutral-200 flex flex-col h-full shadow-2xl md:shadow-sm transform ${isResizingSidebar ? '' : 'transition-all duration-300 ease-in-out'} ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shrink-0 ${isDraggingSlider ? 'opacity-10 md:opacity-100' : 'opacity-100'}`}
        style={{ width: window.innerWidth >= 768 ? `${sidebarWidth}px` : '85vw' }}
      >
        
        {/* Resize Handle (Desktop Only) */}
        <div 
          className="hidden md:block absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-neutral-900/10 active:bg-neutral-900/20 transition-colors z-50"
          style={{ transform: 'translateX(50%)' }}
          onMouseDown={() => setIsResizingSidebar(true)}
        />

        {/* Header */}
        <div className="flex items-center justify-between p-6 md:p-8 pb-6 border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-neutral-900" />
            <h1 className="text-sm font-semibold text-neutral-900 tracking-[0.2em] uppercase">碎片排版</h1>
          </div>
          <button className="md:hidden p-2 text-neutral-500 hover:text-neutral-900" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10">
          {/* Content Edit Section */}
          <div className="space-y-6">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
              <Edit3 className="w-3.5 h-3.5" /> 文本内容
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-2">作品标题</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-0 py-2 bg-transparent border-b border-neutral-200 focus:border-neutral-900 transition-colors outline-none text-neutral-900 placeholder:text-neutral-300"
                  placeholder="输入标题..."
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-2">作者名称</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-0 py-2 bg-transparent border-b border-neutral-200 focus:border-neutral-900 transition-colors outline-none text-neutral-900 placeholder:text-neutral-300"
                  placeholder="输入作者..."
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-2">正文内容</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-4 bg-neutral-50 border border-neutral-100 rounded-sm focus:border-neutral-300 focus:bg-white transition-all outline-none text-neutral-800 h-56 resize-none leading-relaxed"
                  placeholder="在此输入您的长篇文字..."
                />
              </div>
            </div>
          </div>

          {/* Design Section */}
          <div className="space-y-10">
            <div>
              <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                <Layout className="w-3.5 h-3.5" /> 排版预设
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'classic', name: '古典画框', desc: '居中对齐，带艺术内边框' },
                  { id: 'vertical-title', name: '竖版标题', desc: '标题竖排，传统东方美学' },
                  { id: 'modern', name: '现代极简', desc: '左对齐，大面积留白' },
                  { id: 'brutalist', name: '先锋主义', desc: '粗犷线条，强对比排版' },
                ].map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => setLayoutPreset(preset.id as LayoutPreset)}
                    className={`p-4 rounded-sm border text-left transition-all duration-300 ${
                      layoutPreset === preset.id
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
                        : 'border-neutral-200 bg-white hover:border-neutral-400 text-neutral-900'
                    }`}
                  >
                    <div className={`font-medium mb-1.5 text-sm ${layoutPreset === preset.id ? 'text-white' : 'text-neutral-900'}`}>{preset.name}</div>
                    <div className={`text-[11px] line-clamp-2 leading-relaxed ${layoutPreset === preset.id ? 'text-neutral-300' : 'text-neutral-500'}`}>{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-neutral-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> 页码设置
                </h2>
                <div className="flex bg-neutral-100 p-1 rounded-sm">
                  {(['left', 'center', 'right'] as PageNumberPosition[]).map(pos => (
                    <button
                      key={pos}
                      onClick={() => setPageNumberPosition(pos)}
                      className={`px-3 py-1 text-[10px] font-medium rounded-sm transition-colors ${pageNumberPosition === pos ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                    >
                      {pos === 'left' ? '居左' : pos === 'center' ? '居中' : '居右'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'classic', label: '- 1 / 5 -' },
                  { id: 'slash', label: '1 / 5' },
                  { id: 'line', label: '— 1 —' },
                  { id: 'box', label: '[ 1 / 5 ]' },
                  { id: 'minimal', label: '1' },
                  { id: 'none', label: '无' },
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setPageNumberStyle(style.id as PageNumberStyle)}
                    className={`py-3 text-[11px] font-medium rounded-sm border transition-all duration-300 ${pageNumberStyle === style.id ? 'border-neutral-900 bg-neutral-900 text-white shadow-md' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50'}`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-neutral-100">
              <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                <SlidersHorizontal className="w-3.5 h-3.5" /> 自定义微调
              </h2>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">画布比例</label>
                  </div>
                  <select 
                    value={aspectRatio} 
                    onChange={(e) => setAspectRatio(e.target.value as any)}
                    className="w-full p-2.5 text-sm border-b border-neutral-200 outline-none focus:border-neutral-900 bg-transparent transition-colors cursor-pointer"
                  >
                    <option value="3:4">3:4 (小红书/标准)</option>
                    <option value="9:16">9:16 (手机全屏)</option>
                    <option value="4:5">4:5 (社交媒体)</option>
                    <option value="1:1">1:1 (正方形)</option>
                    <option value="A4">A4 (打印/文档)</option>
                  </select>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">留白大小</label>
                    <span className="text-[11px] text-neutral-400 font-mono">{paddingRatio}%</span>
                  </div>
                  <input type="range" {...sliderEvents} min="5" max="25" step="1" value={paddingRatio} onChange={(e) => setPaddingRatio(Number(e.target.value))} className="w-full accent-neutral-900" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">正文字号</label>
                    <span className="text-[11px] text-neutral-400 font-mono">{fontSize}px</span>
                  </div>
                  <input type="range" {...sliderEvents} min="12" max="32" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-neutral-900" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">标题字号</label>
                      <span className="text-[11px] text-neutral-400 font-mono">{titleFontSize}px</span>
                    </div>
                    <input type="range" {...sliderEvents} min="20" max="60" value={titleFontSize} onChange={(e) => setTitleFontSize(Number(e.target.value))} className="w-full accent-neutral-900" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">作者字号</label>
                      <span className="text-[11px] text-neutral-400 font-mono">{authorFontSize}px</span>
                    </div>
                    <input type="range" {...sliderEvents} min="12" max="30" value={authorFontSize} onChange={(e) => setAuthorFontSize(Number(e.target.value))} className="w-full accent-neutral-900" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">标题粗细</label>
                      <span className="text-[11px] text-neutral-400 font-mono">{titleFontWeight}</span>
                    </div>
                    <input type="range" {...sliderEvents} min="100" max="900" step="100" value={titleFontWeight} onChange={(e) => setTitleFontWeight(Number(e.target.value))} className="w-full accent-neutral-900" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">正文粗细</label>
                      <span className="text-[11px] text-neutral-400 font-mono">{fontWeight}</span>
                    </div>
                    <input type="range" {...sliderEvents} min="100" max="900" step="100" value={fontWeight} onChange={(e) => setFontWeight(Number(e.target.value))} className="w-full accent-neutral-900" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">段落行距</label>
                    <span className="text-[11px] text-neutral-400 font-mono">{lineHeight}</span>
                  </div>
                  <input type="range" {...sliderEvents} min="1.5" max="3.0" step="0.1" value={lineHeight} onChange={(e) => setLineHeight(Number(e.target.value))} className="w-full accent-neutral-900" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">字间距</label>
                    <span className="text-[11px] text-neutral-400 font-mono">{letterSpacing}px</span>
                  </div>
                  <input type="range" {...sliderEvents} min="0" max="10" step="0.5" value={letterSpacing} onChange={(e) => setLetterSpacing(Number(e.target.value))} className="w-full accent-neutral-900" />
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-neutral-100">
              <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                <Palette className="w-3.5 h-3.5" /> 颜色与字体
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block mb-3">自定义背景图</label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-sm cursor-pointer hover:bg-neutral-100 hover:border-neutral-300 transition-all">
                      <ImageIcon className="w-4 h-4 text-neutral-500" />
                      <span className="text-xs text-neutral-600 truncate">{customBgImageFileName || '上传背景图片 (.jpg, .png)'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleBgImageUpload} />
                    </label>
                    {customBgImage && (
                      <button onClick={() => { setCustomBgImage(''); setCustomBgImageFileName(''); }} className="px-4 py-3 text-xs text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-sm transition-colors">
                        清除
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block mb-3">自定义字体</label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-sm cursor-pointer hover:bg-neutral-100 hover:border-neutral-300 transition-all">
                      <Upload className="w-4 h-4 text-neutral-500" />
                      <span className="text-xs text-neutral-600 truncate">{customFontFileName || '上传字体文件 (.ttf, .otf)'}</span>
                      <input type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={handleFontUpload} />
                    </label>
                    {customFontFamily && (
                      <button onClick={() => { setCustomFontFamily(''); setCustomFontFileName(''); }} className="px-4 py-3 text-xs text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-sm transition-colors">
                        清除
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block mb-3">文字颜色</label>
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-neutral-200 shadow-sm">
                        <input 
                          type="color" 
                          value={customTextColor || '#000000'} 
                          onChange={(e) => setCustomTextColor(e.target.value)}
                          className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                        />
                      </div>
                      {customTextColor && (
                        <button onClick={() => setCustomTextColor('')} className="text-[11px] text-neutral-400 hover:text-neutral-900 transition-colors uppercase tracking-wider">重置</button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block mb-3">背景颜色</label>
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-neutral-200 shadow-sm">
                        <input 
                          type="color" 
                          value={customBgColor || '#ffffff'} 
                          onChange={(e) => setCustomBgColor(e.target.value)}
                          className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                        />
                      </div>
                      {customBgColor && (
                        <button onClick={() => setCustomBgColor('')} className="text-[11px] text-neutral-400 hover:text-neutral-900 transition-colors uppercase tracking-wider">重置</button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block mb-3">对齐方式</label>
                  <div className="flex bg-neutral-100 p-1 rounded-sm">
                    <button 
                      onClick={() => setTextAlign('left')}
                      className={`flex-1 flex justify-center py-2 rounded-sm transition-all duration-300 ${textAlign === 'left' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-400 hover:text-neutral-700'}`}
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setTextAlign('center')}
                      className={`flex-1 flex justify-center py-2 rounded-sm transition-all duration-300 ${textAlign === 'center' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-400 hover:text-neutral-700'}`}
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setTextAlign('justify')}
                      className={`flex-1 flex justify-center py-2 rounded-sm transition-all duration-300 ${textAlign === 'justify' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-400 hover:text-neutral-700'}`}
                    >
                      <AlignJustify className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">首行缩进</label>
                  <button 
                    onClick={() => setParagraphIndent(!paragraphIndent)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${paragraphIndent ? 'bg-neutral-900' : 'bg-neutral-300'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${paragraphIndent ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export Actions */}
        <div className="p-6 border-t border-neutral-100 bg-white space-y-3 shrink-0">
          <button
            onClick={handleExportShortImages}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-neutral-900 text-white rounded-sm font-medium hover:bg-neutral-800 transition-all duration-300 disabled:opacity-50 shadow-md hover:shadow-lg text-sm tracking-[0.1em]"
          >
            <Layers className="w-4 h-4" /> 
            {isExporting ? '生成中...' : '导出分页短图'}
          </button>
        </div>
      </div>

      {/* Right Panel: Preview */}
      <div className={`flex-1 flex flex-col items-center p-4 md:p-12 overflow-auto bg-[#F9F9F9] h-screen relative ${userZoom > 1 ? 'justify-start' : 'justify-center'}`}>
        
        {/* Mobile FAB */}
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden absolute top-4 left-4 z-30 p-3 bg-white rounded-full shadow-md text-neutral-900 border border-neutral-100 flex items-center gap-2"
        >
          <Menu className="w-5 h-5" />
          <span className="text-xs font-medium pr-1">设置</span>
        </button>

        <div className={`flex flex-col items-center w-full ${userZoom > 1 ? 'h-auto' : 'h-full justify-center'}`}>
          <div 
            className="w-full flex justify-between items-center text-neutral-400 text-[10px] md:text-xs px-1 uppercase tracking-widest font-mono mb-4 md:mb-6 shrink-0"
            style={{ maxWidth: userZoom <= 1 ? `calc(min(100%, 85vh * ${CANVAS_W / CANVAS_H}))` : '100%' }}
          >
            <span>实时预览 ({aspectRatio})</span>
            <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full shadow-sm border border-neutral-100">
              <button 
                onClick={() => setUserZoom(z => Math.max(0.5, z - 0.1))}
                className="hover:text-neutral-900 transition-colors"
              >
                -
              </button>
              <span className="w-8 text-center text-neutral-900 font-medium">{Math.round(userZoom * 100)}%</span>
              <button 
                onClick={() => setUserZoom(z => Math.min(3, z + 0.1))}
                className="hover:text-neutral-900 transition-colors"
              >
                +
              </button>
            </div>
            <span>{content.length} 字 / {pages.length} 页</span>
          </div>
          
          {/* The Preview Canvas */}
          <div 
            ref={previewContainerRef}
            className="relative shadow-[0_20px_40px_rgba(0,0,0,0.08)] overflow-hidden bg-white transition-all duration-300 ease-out shrink-0"
            style={{ 
              aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
              height: `${85 * userZoom}vh`,
              maxHeight: userZoom <= 1 ? '85vh' : 'none',
              maxWidth: userZoom <= 1 ? '100%' : 'none'
            }}
          >
            <div 
              className={`absolute top-0 left-0 origin-top-left flex flex-col bg-[#F9F8F6] text-[#2C2A28] font-serif`}
            style={{ 
              width: `${CANVAS_W}px`, 
              height: `${CANVAS_H}px`, 
              transform: `scale(${previewScale})`,
              padding: `${PADDING_Y}px ${PADDING_X}px`,
              backgroundColor: customBgColor || undefined,
              backgroundImage: customBgImage ? `url(${customBgImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: customTextColor || undefined,
              fontFamily: customFontFamily || undefined
            }}
          >
            {renderFrame()}
            {pages[currentPageIndex] && renderPageContent(pages[currentPageIndex], currentPageIndex)}
            
            {renderPageNumberIndicator(currentPageIndex, pages.length)}
          </div>
        </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-6 md:gap-8 mt-6 md:mt-10">
          <button 
            onClick={() => setCurrentPageIndex(p => Math.max(0, p - 1))}
            disabled={currentPageIndex === 0}
            className="p-2 md:p-3 rounded-full hover:bg-neutral-200 disabled:opacity-20 transition-all duration-300"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-neutral-800" />
          </button>
          <span className="text-[10px] md:text-xs font-mono text-neutral-400 tracking-[0.2em] uppercase">
            {currentPageIndex + 1} / {pages.length}
          </span>
          <button 
            onClick={() => setCurrentPageIndex(p => Math.min(pages.length - 1, p + 1))}
            disabled={currentPageIndex === pages.length - 1}
            className="p-2 md:p-3 rounded-full hover:bg-neutral-200 disabled:opacity-20 transition-all duration-300"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-neutral-800" />
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
              backgroundImage: customBgImage ? `url(${customBgImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: customTextColor || undefined,
              fontFamily: customFontFamily || undefined
            }}
          >
            {renderFrame()}
            {renderPageContent(page, idx)}
            {renderPageNumberIndicator(idx, pages.length)}
          </div>
        ))}
      </div>

      {/* Cropper Modal */}
      {rawImageSrc && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col">
          <div className="flex-1 relative">
            <Cropper
              image={rawImageSrc}
              crop={crop}
              zoom={zoom}
              aspect={CANVAS_W / CANVAS_H}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div className="p-6 bg-white flex items-center justify-between shrink-0">
            <button onClick={() => setRawImageSrc(null)} className="px-6 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-900">取消</button>
            <div className="flex items-center gap-4 w-1/2 max-w-[300px]">
              <span className="text-xs text-neutral-500">缩放</span>
              <input type="range" {...sliderEvents} min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-neutral-900" />
            </div>
            <button onClick={handleCropConfirm} className="px-6 py-2 text-sm font-medium bg-neutral-900 text-white rounded-sm hover:bg-neutral-800">确认裁剪</button>
          </div>
        </div>
      )}
    </div>
  );
}
