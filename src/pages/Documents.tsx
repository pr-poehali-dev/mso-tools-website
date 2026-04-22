import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const TEMPLATES: Record<string, { title: string; content: string }> = {
  blank: { title: "Новый документ", content: "<p>Начните вводить текст...</p>" },
  contract: {
    title: "Договор оказания услуг",
    content: `<h1 style="text-align:center">ДОГОВОР №___</h1>
<p style="text-align:center"><i>оказания услуг</i></p>
<p>г. Москва &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; «___» __________ 20__ г.</p>
<p><b>ООО «___________»</b>, именуемое в дальнейшем «Исполнитель», в лице директора ___________, действующего на основании Устава, с одной стороны, и</p>
<p><b>___________</b>, именуемый в дальнейшем «Заказчик», с другой стороны, заключили настоящий Договор о нижеследующем:</p>
<h2>1. Предмет Договора</h2>
<p>1.1. Исполнитель обязуется оказать Заказчику услуги, указанные в Приложении №1.</p>
<h2>2. Стоимость и порядок расчётов</h2>
<p>2.1. Стоимость услуг составляет _______ рублей.</p>
<h2>3. Реквизиты сторон</h2>`,
  },
  letter: {
    title: "Деловое письмо",
    content: `<p style="text-align:right">Генеральному директору<br>ООО «___________»<br>___________</p>
<p style="text-align:center"><b>Уважаемый ___________!</b></p>
<p>Настоящим письмом сообщаем Вам о ___________.</p>
<p>Просим рассмотреть наше предложение и сообщить о принятом решении в срок до «___» __________ 20__ г.</p>
<p>С уважением,<br>___________</p>`,
  },
  report: {
    title: "Отчёт о проделанной работе",
    content: `<h1 style="text-align:center">ОТЧЁТ</h1>
<p style="text-align:center"><i>о проделанной работе за ___________</i></p>
<h2>1. Общая информация</h2>
<p>Период: ___________<br>Ответственный: ___________</p>
<h2>2. Выполненные задачи</h2>
<ul><li>Задача 1</li><li>Задача 2</li><li>Задача 3</li></ul>
<h2>3. Результаты</h2>
<p>Описание достигнутых результатов.</p>
<h2>4. Выводы и планы</h2>
<p>___________</p>`,
  },
};

const STORAGE_KEY = "officekit_document";

const Documents = () => {
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("Новый документ");
  const [fontSize, setFontSize] = useState("3");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [saved, setSaved] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && editorRef.current) {
      try {
        const data = JSON.parse(raw);
        setTitle(data.title || "Новый документ");
        editorRef.current.innerHTML = data.content || TEMPLATES.blank.content;
      } catch {
        editorRef.current.innerHTML = TEMPLATES.blank.content;
      }
    } else if (editorRef.current) {
      editorRef.current.innerHTML = TEMPLATES.blank.content;
    }
  }, []);

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    setSaved(false);
  };

  const handleSave = () => {
    if (!editorRef.current) return;
    const data = { title, content: editorRef.current.innerHTML, savedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSaved(true);
  };

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportDoc = () => {
    if (!editorRef.current) return;
    const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${title}</title></head><body>${editorRef.current.innerHTML}</body></html>`;
    downloadFile(html, `${title}.doc`, "application/msword");
  };

  const exportHtml = () => {
    if (!editorRef.current) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial;max-width:800px;margin:40px auto;padding:20px;line-height:1.6}</style></head><body>${editorRef.current.innerHTML}</body></html>`;
    downloadFile(html, `${title}.html`, "text/html");
  };

  const exportTxt = () => {
    if (!editorRef.current) return;
    downloadFile(editorRef.current.innerText, `${title}.txt`, "text/plain");
  };

  const printDoc = () => {
    const content = editorRef.current?.innerHTML || "";
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;max-width:800px;margin:40px auto;padding:20px;line-height:1.6}</style></head><body>${content}</body></html>`);
    w.document.close();
    w.print();
  };

  const loadTemplate = (key: string) => {
    const t = TEMPLATES[key];
    if (!t || !editorRef.current) return;
    setTitle(t.title);
    editorRef.current.innerHTML = t.content;
    setShowTemplates(false);
    setSaved(false);
  };

  const clearDoc = () => {
    if (!confirm("Очистить документ?")) return;
    if (editorRef.current) editorRef.current.innerHTML = "<p><br></p>";
    setTitle("Новый документ");
    localStorage.removeItem(STORAGE_KEY);
    setSaved(true);
  };

  const insertImage = () => {
    const url = prompt("Введите URL изображения:");
    if (url) exec("insertImage", url);
  };

  const insertLink = () => {
    const url = prompt("Введите URL ссылки:");
    if (url) exec("createLink", url);
  };

  return (
    <div className="min-h-screen bg-[#f3f2f1] text-black">
      {/* Top Bar */}
      <div className="bg-[#2b579a] text-white">
        <div className="flex items-center gap-3 px-4 py-2">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:bg-white/10 px-3 py-1.5 rounded text-sm">
            <Icon name="ArrowLeft" size={16} />
            На главную
          </button>
          <div className="w-px h-6 bg-white/20" />
          <Icon name="FileText" size={18} />
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setSaved(false); }}
            className="bg-transparent border-b border-transparent hover:border-white/30 focus:border-white focus:outline-none px-2 py-1 text-sm font-medium min-w-[200px]"
          />
          <span className="text-xs text-white/70 ml-2">
            {saved ? "✓ Сохранено" : "● Не сохранено"}
          </span>
          <div className="flex-1" />
          <span className="text-xs text-white/70">Browser Office Word</span>
        </div>

        {/* Menu Bar */}
        <div className="flex items-center gap-1 px-4 py-1 bg-[#2b579a] border-t border-white/10 text-sm">
          <button onClick={() => setShowTemplates(!showTemplates)} className="px-3 py-1 hover:bg-white/10 rounded">Шаблоны</button>
          <button onClick={handleSave} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1">
            <Icon name="Save" size={14} /> Сохранить
          </button>
          <div className="relative group">
            <button className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1">
              <Icon name="Download" size={14} /> Скачать
            </button>
            <div className="absolute left-0 top-full mt-0 hidden group-hover:block bg-white text-black rounded-b shadow-lg min-w-[180px] z-50">
              <button onClick={exportDoc} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                <Icon name="FileText" size={14} /> Word (.doc)
              </button>
              <button onClick={exportHtml} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                <Icon name="Code" size={14} /> HTML (.html)
              </button>
              <button onClick={exportTxt} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                <Icon name="File" size={14} /> Текст (.txt)
              </button>
            </div>
          </div>
          <button onClick={printDoc} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1">
            <Icon name="Printer" size={14} /> Печать / PDF
          </button>
          <button onClick={clearDoc} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1">
            <Icon name="Trash2" size={14} /> Очистить
          </button>
        </div>
      </div>

      {/* Templates dropdown */}
      {showTemplates && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-6xl mx-auto flex flex-wrap gap-2">
            {Object.entries(TEMPLATES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => loadTemplate(key)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 hover:border-[#2b579a] text-sm flex items-center gap-2"
              >
                <Icon name="FileText" size={14} className="text-[#2b579a]" />
                {t.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-1 px-4 py-2 flex-wrap">
          <select
            value={fontFamily}
            onChange={(e) => { setFontFamily(e.target.value); exec("fontName", e.target.value); }}
            className="border border-gray-300 rounded px-2 py-1 text-sm min-w-[130px]"
          >
            {["Arial", "Times New Roman", "Georgia", "Courier New", "Verdana", "Tahoma"].map(f => (
              <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
            ))}
          </select>
          <select
            value={fontSize}
            onChange={(e) => { setFontSize(e.target.value); exec("fontSize", e.target.value); }}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            {[["1","8"],["2","10"],["3","12"],["4","14"],["5","18"],["6","24"],["7","36"]].map(([v,l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <ToolBtn onClick={() => exec("bold")} icon="Bold" title="Жирный (Ctrl+B)" />
          <ToolBtn onClick={() => exec("italic")} icon="Italic" title="Курсив (Ctrl+I)" />
          <ToolBtn onClick={() => exec("underline")} icon="Underline" title="Подчёркнутый (Ctrl+U)" />
          <ToolBtn onClick={() => exec("strikeThrough")} icon="Strikethrough" title="Зачёркнутый" />

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <input
            type="color"
            onChange={(e) => exec("foreColor", e.target.value)}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
            title="Цвет текста"
          />
          <input
            type="color"
            onChange={(e) => exec("hiliteColor", e.target.value)}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
            title="Цвет фона"
          />

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <ToolBtn onClick={() => exec("justifyLeft")} icon="AlignLeft" title="По левому краю" />
          <ToolBtn onClick={() => exec("justifyCenter")} icon="AlignCenter" title="По центру" />
          <ToolBtn onClick={() => exec("justifyRight")} icon="AlignRight" title="По правому краю" />
          <ToolBtn onClick={() => exec("justifyFull")} icon="AlignJustify" title="По ширине" />

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <ToolBtn onClick={() => exec("insertUnorderedList")} icon="List" title="Маркированный список" />
          <ToolBtn onClick={() => exec("insertOrderedList")} icon="ListOrdered" title="Нумерованный список" />
          <ToolBtn onClick={() => exec("indent")} icon="IndentIncrease" title="Увеличить отступ" />
          <ToolBtn onClick={() => exec("outdent")} icon="IndentDecrease" title="Уменьшить отступ" />

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <select
            onChange={(e) => { exec("formatBlock", e.target.value); e.target.value = ""; }}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            defaultValue=""
          >
            <option value="" disabled>Стиль</option>
            <option value="p">Обычный</option>
            <option value="h1">Заголовок 1</option>
            <option value="h2">Заголовок 2</option>
            <option value="h3">Заголовок 3</option>
            <option value="blockquote">Цитата</option>
            <option value="pre">Код</option>
          </select>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <ToolBtn onClick={insertLink} icon="Link" title="Вставить ссылку" />
          <ToolBtn onClick={insertImage} icon="Image" title="Вставить изображение" />
          <ToolBtn onClick={() => exec("insertHorizontalRule")} icon="Minus" title="Горизонтальная линия" />

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <ToolBtn onClick={() => exec("undo")} icon="Undo2" title="Отменить (Ctrl+Z)" />
          <ToolBtn onClick={() => exec("redo")} icon="Redo2" title="Вернуть (Ctrl+Y)" />
          <ToolBtn onClick={() => exec("removeFormat")} icon="Eraser" title="Очистить формат" />
        </div>
      </div>

      {/* Editor Area */}
      <div className="py-10 px-4">
        <div className="max-w-[900px] mx-auto">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={() => setSaved(false)}
            className="bg-white shadow-lg rounded-sm min-h-[1100px] p-24 outline-none text-black word-editor"
            style={{ fontFamily: "Arial, sans-serif", fontSize: "12pt", lineHeight: 1.6 }}
          />
        </div>
      </div>

      <style>{`
        .word-editor h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
        .word-editor h2 { font-size: 1.5em; font-weight: bold; margin: 0.75em 0; }
        .word-editor h3 { font-size: 1.17em; font-weight: bold; margin: 0.83em 0; }
        .word-editor p { margin: 0.5em 0; }
        .word-editor ul, .word-editor ol { padding-left: 2em; margin: 0.5em 0; }
        .word-editor blockquote { border-left: 4px solid #2b579a; padding-left: 1em; margin: 1em 0; color: #555; }
        .word-editor pre { background: #f5f5f5; padding: 1em; border-radius: 4px; font-family: 'Courier New', monospace; }
        .word-editor img { max-width: 100%; }
        .word-editor a { color: #2b579a; text-decoration: underline; }
        .word-editor:empty::before { content: 'Начните вводить текст...'; color: #999; }
      `}</style>
    </div>
  );
};

const ToolBtn = ({ onClick, icon, title }: { onClick: () => void; icon: string; title: string }) => (
  <button
    onClick={onClick}
    title={title}
    className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-700 transition-colors"
  >
    <Icon name={icon} size={16} fallback="Square" />
  </button>
);

export default Documents;