import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const STORAGE_KEY = "officekit_presentation";

type Slide = {
  id: string;
  title: string;
  content: string;
  bg: string;
  textColor: string;
  layout: "title" | "content" | "split";
};

const THEMES = [
  { bg: "#ffffff", text: "#1a1a1a", name: "Классика" },
  { bg: "#1a1a2e", text: "#ffffff", name: "Ночь" },
  { bg: "linear-gradient(135deg,#667eea,#764ba2)", text: "#ffffff", name: "Градиент" },
  { bg: "#fef3c7", text: "#78350f", name: "Солнце" },
  { bg: "#dbeafe", text: "#1e3a8a", name: "Океан" },
  { bg: "#1e293b", text: "#f1f5f9", name: "Сталь" },
];

const TEMPLATES: Record<string, Slide[]> = {
  blank: [
    { id: "1", title: "Новая презентация", content: "Нажмите для редактирования", bg: "#ffffff", textColor: "#1a1a1a", layout: "title" },
  ],
  pitch: [
    { id: "1", title: "Название стартапа", content: "Краткий слоган компании\nВаше имя · 2026", bg: "linear-gradient(135deg,#667eea,#764ba2)", textColor: "#ffffff", layout: "title" },
    { id: "2", title: "Проблема", content: "• Какую проблему решаем\n• Для кого\n• Почему это важно", bg: "#ffffff", textColor: "#1a1a1a", layout: "content" },
    { id: "3", title: "Решение", content: "• Что мы предлагаем\n• Как это работает\n• Ключевая фича", bg: "#ffffff", textColor: "#1a1a1a", layout: "content" },
    { id: "4", title: "Рынок", content: "TAM: $10B\nSAM: $2B\nSOM: $200M", bg: "#dbeafe", textColor: "#1e3a8a", layout: "content" },
    { id: "5", title: "Команда", content: "Имя Фамилия — CEO\nИмя Фамилия — CTO\nИмя Фамилия — CMO", bg: "#ffffff", textColor: "#1a1a1a", layout: "content" },
    { id: "6", title: "Спасибо!", content: "hello@startup.com\n+7 (000) 000-00-00", bg: "linear-gradient(135deg,#667eea,#764ba2)", textColor: "#ffffff", layout: "title" },
  ],
  report: [
    { id: "1", title: "Отчёт за квартал", content: "Q1 2026 · Общие результаты", bg: "#1e293b", textColor: "#f1f5f9", layout: "title" },
    { id: "2", title: "Ключевые метрики", content: "• Выручка: 12M ₽ (+24%)\n• Клиенты: 1 240 (+18%)\n• NPS: 72", bg: "#ffffff", textColor: "#1a1a1a", layout: "content" },
    { id: "3", title: "Выводы", content: "Отличный квартал!\nФокус на удержание.", bg: "#fef3c7", textColor: "#78350f", layout: "content" },
  ],
};

const Presentation = () => {
  const navigate = useNavigate();
  const [slides, setSlides] = useState<Slide[]>(TEMPLATES.blank);
  const [current, setCurrent] = useState(0);
  const [title, setTitle] = useState("Новая презентация");
  const [saved, setSaved] = useState(true);
  const [showTpl, setShowTpl] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const fsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        setSlides(d.slides || TEMPLATES.blank);
        setTitle(d.title || "Новая презентация");
      } catch { /* noop */ }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ title, slides }));
    setSaved(true);
  };

  const updateSlide = (patch: Partial<Slide>) => {
    setSlides(prev => prev.map((s, i) => i === current ? { ...s, ...patch } : s));
    setSaved(false);
  };

  const addSlide = () => {
    const s: Slide = { id: Date.now().toString(), title: "Новый слайд", content: "Содержимое слайда", bg: "#ffffff", textColor: "#1a1a1a", layout: "content" };
    setSlides(prev => [...prev.slice(0, current + 1), s, ...prev.slice(current + 1)]);
    setCurrent(current + 1);
    setSaved(false);
  };

  const deleteSlide = () => {
    if (slides.length <= 1) return;
    setSlides(prev => prev.filter((_, i) => i !== current));
    setCurrent(Math.max(0, current - 1));
    setSaved(false);
  };

  const download = (content: string, name: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  const exportHTML = () => {
    const slidesHtml = slides.map((s, i) => `
      <section style="width:100vw;height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:60px;background:${s.bg};color:${s.textColor};box-sizing:border-box;page-break-after:always;">
        <h1 style="font-size:48px;margin-bottom:30px;text-align:center;font-family:Arial">${s.title}</h1>
        <div style="font-size:22px;white-space:pre-wrap;max-width:900px;text-align:${s.layout === 'title' ? 'center' : 'left'};font-family:Arial">${s.content}</div>
        <div style="position:absolute;bottom:20px;right:30px;font-size:14px;opacity:0.5">${i + 1} / ${slides.length}</div>
      </section>`).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body{margin:0;font-family:Arial}@media print{section{page-break-after:always}}</style></head><body>${slidesHtml}</body></html>`;
    download(html, `${title}.html`, "text/html");
  };

  const exportPrint = () => {
    const slidesHtml = slides.map((s) => `
      <section style="width:100%;min-height:95vh;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:60px;background:${s.bg};color:${s.textColor};box-sizing:border-box;page-break-after:always;">
        <h1 style="font-size:48px;margin-bottom:30px;text-align:center">${s.title}</h1>
        <div style="font-size:22px;white-space:pre-wrap;max-width:900px;text-align:${s.layout === 'title' ? 'center' : 'left'}">${s.content}</div>
      </section>`).join("");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>${title}</title><style>body{margin:0;font-family:Arial}</style></head><body>${slidesHtml}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const loadTpl = (k: string) => {
    setSlides(TEMPLATES[k]);
    setCurrent(0);
    setShowTpl(false);
    setSaved(false);
  };

  useEffect(() => {
    if (!fullscreen) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") setCurrent(c => Math.min(slides.length - 1, c + 1));
      if (e.key === "ArrowLeft") setCurrent(c => Math.max(0, c - 1));
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [fullscreen, slides.length]);

  const s = slides[current];

  if (fullscreen) {
    return (
      <div ref={fsRef} className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: s.bg, color: s.textColor }}>
        <div className={`max-w-5xl w-full px-20 ${s.layout === 'title' ? 'text-center' : ''}`}>
          <h1 className="text-6xl font-bold mb-8" style={{ fontFamily: "Arial" }}>{s.title}</h1>
          <div className="text-2xl whitespace-pre-wrap leading-relaxed">{s.content}</div>
        </div>
        <div className="absolute bottom-4 right-6 text-sm opacity-50">{current + 1} / {slides.length}</div>
        <button onClick={() => setFullscreen(false)} className="absolute top-4 right-4 px-3 py-1 rounded bg-black/20 text-white text-sm">Esc</button>
        <button onClick={() => setCurrent(c => Math.max(0, c - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/20 text-white">‹</button>
        <button onClick={() => setCurrent(c => Math.min(slides.length - 1, c + 1))} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/20 text-white">›</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f2f1] text-black flex flex-col">
      <div className="bg-[#b7472a] text-white">
        <div className="flex items-center gap-3 px-4 py-2">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:bg-white/10 px-3 py-1.5 rounded text-sm">
            <Icon name="ArrowLeft" size={16} /> На главную
          </button>
          <div className="w-px h-6 bg-white/20" />
          <Icon name="Monitor" size={18} />
          <input value={title} onChange={e => { setTitle(e.target.value); setSaved(false); }}
            className="bg-transparent border-b border-transparent hover:border-white/30 focus:border-white focus:outline-none px-2 py-1 text-sm font-medium min-w-[200px]" />
          <span className="text-xs text-white/70 ml-2">{saved ? "✓ Сохранено" : "● Не сохранено"}</span>
          <div className="flex-1" />
          <span className="text-xs text-white/70">OfficeKit PowerPoint</span>
        </div>
        <div className="flex items-center gap-1 px-4 py-1 border-t border-white/10 text-sm flex-wrap">
          <button onClick={() => setShowTpl(!showTpl)} className="px-3 py-1 hover:bg-white/10 rounded">Шаблоны</button>
          <button onClick={handleSave} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1"><Icon name="Save" size={14} /> Сохранить</button>
          <button onClick={addSlide} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1"><Icon name="Plus" size={14} /> Слайд</button>
          <button onClick={deleteSlide} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1"><Icon name="Trash2" size={14} /> Удалить</button>
          <button onClick={() => setFullscreen(true)} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1"><Icon name="Play" size={14} /> Показ</button>
          <button onClick={exportHTML} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1"><Icon name="Download" size={14} /> HTML</button>
          <button onClick={exportPrint} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1"><Icon name="Printer" size={14} /> PDF</button>
        </div>
      </div>

      {showTpl && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex gap-2 flex-wrap">
          {Object.entries(TEMPLATES).map(([k, arr]) => (
            <button key={k} onClick={() => loadTpl(k)} className="px-4 py-2 border border-gray-300 rounded hover:border-[#b7472a] text-sm flex items-center gap-2">
              <Icon name="Monitor" size={14} className="text-[#b7472a]" /> {arr[0].title}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Slides panel */}
        <div className="w-56 bg-gray-100 border-r border-gray-300 overflow-y-auto p-2 space-y-2">
          {slides.map((sl, i) => (
            <div
              key={sl.id}
              onClick={() => setCurrent(i)}
              className={`cursor-pointer rounded overflow-hidden border-2 ${i === current ? "border-[#b7472a]" : "border-transparent"}`}
            >
              <div className="aspect-video p-3 flex flex-col justify-center text-[7px] overflow-hidden" style={{ background: sl.bg, color: sl.textColor }}>
                <div className="font-bold mb-1 line-clamp-2">{sl.title}</div>
                <div className="opacity-70 line-clamp-3 whitespace-pre-wrap">{sl.content}</div>
              </div>
              <div className="text-xs text-gray-500 px-2 py-0.5">{i + 1}</div>
            </div>
          ))}
        </div>

        {/* Slide editor */}
        <div className="flex-1 overflow-auto p-8 flex flex-col items-center gap-4">
          <div className="w-full max-w-4xl aspect-video rounded-lg shadow-2xl overflow-hidden flex flex-col justify-center items-center p-16 relative" style={{ background: s.bg, color: s.textColor }}>
            <input
              value={s.title}
              onChange={e => updateSlide({ title: e.target.value })}
              className="w-full text-5xl font-bold bg-transparent border-b-2 border-transparent focus:border-current/30 focus:outline-none text-center mb-8"
              style={{ color: s.textColor, fontFamily: "Arial" }}
            />
            <textarea
              value={s.content}
              onChange={e => updateSlide({ content: e.target.value })}
              className="w-full text-xl bg-transparent focus:outline-none resize-none min-h-[200px]"
              style={{ color: s.textColor, textAlign: s.layout === 'title' ? 'center' : 'left' }}
            />
          </div>

          {/* Theme picker */}
          <div className="bg-white rounded-lg shadow p-3 flex gap-2 items-center flex-wrap">
            <span className="text-xs text-gray-500 mr-2">Тема:</span>
            {THEMES.map(t => (
              <button
                key={t.name}
                onClick={() => updateSlide({ bg: t.bg, textColor: t.text })}
                className="w-10 h-10 rounded border-2 border-gray-200 hover:border-[#b7472a]"
                style={{ background: t.bg }}
                title={t.name}
              />
            ))}
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <span className="text-xs text-gray-500 mr-2">Макет:</span>
            <select value={s.layout} onChange={e => updateSlide({ layout: e.target.value as Slide["layout"] })} className="border border-gray-300 rounded px-2 py-1 text-sm">
              <option value="title">Титульный</option>
              <option value="content">Контент</option>
              <option value="split">Центр</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Presentation;
