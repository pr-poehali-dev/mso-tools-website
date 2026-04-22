import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const STORAGE_KEY = "officekit_forms";

type FieldType = "text" | "textarea" | "email" | "number" | "select" | "radio" | "checkbox" | "date";

type Field = {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
};

type FormDoc = { title: string; description: string; fields: Field[] };

const TEMPLATES: Record<string, FormDoc> = {
  blank: { title: "Новая форма", description: "Описание формы", fields: [] },
  feedback: {
    title: "Форма обратной связи",
    description: "Поделитесь впечатлениями о нашем сервисе",
    fields: [
      { id: "1", type: "text", label: "Ваше имя", required: true, placeholder: "Иван" },
      { id: "2", type: "email", label: "Email", required: true, placeholder: "ivan@mail.ru" },
      { id: "3", type: "radio", label: "Оценка", required: true, options: ["Отлично", "Хорошо", "Нормально", "Плохо"] },
      { id: "4", type: "textarea", label: "Ваш комментарий", placeholder: "Расскажите подробнее..." },
    ],
  },
  survey: {
    title: "Опрос сотрудников",
    description: "Анкета для оценки удовлетворённости работой",
    fields: [
      { id: "1", type: "text", label: "ФИО", required: true },
      { id: "2", type: "select", label: "Отдел", options: ["Разработка", "Маркетинг", "Продажи", "HR"] },
      { id: "3", type: "radio", label: "Устраивает ли вас график?", options: ["Да", "Нет", "Частично"] },
      { id: "4", type: "checkbox", label: "Что бы вы улучшили?", options: ["Зарплату", "Офис", "Процессы", "Команду"] },
      { id: "5", type: "textarea", label: "Пожелания руководству" },
    ],
  },
  checklist: {
    title: "Чек-лист запуска проекта",
    description: "Отметьте выполненные пункты",
    fields: [
      { id: "1", type: "checkbox", label: "Подготовка", options: ["ТЗ утверждено", "Команда собрана", "Бюджет выделен"] },
      { id: "2", type: "checkbox", label: "Разработка", options: ["Дизайн готов", "Код написан", "Тесты пройдены"] },
      { id: "3", type: "checkbox", label: "Запуск", options: ["Маркетинг готов", "Сервера развёрнуты", "Документация"] },
      { id: "4", type: "date", label: "Дата запуска", required: true },
    ],
  },
};

const Forms = () => {
  const navigate = useNavigate();
  const [doc, setDoc] = useState<FormDoc>(TEMPLATES.blank);
  const [saved, setSaved] = useState(true);
  const [showTpl, setShowTpl] = useState(false);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { setDoc(JSON.parse(raw)); } catch { /* noop */ }
    }
  }, []);

  const handleSave = () => { localStorage.setItem(STORAGE_KEY, JSON.stringify(doc)); setSaved(true); };

  const update = (patch: Partial<FormDoc>) => { setDoc(prev => ({ ...prev, ...patch })); setSaved(false); };

  const addField = (type: FieldType) => {
    const f: Field = {
      id: Date.now().toString(),
      type,
      label: "Новый вопрос",
      placeholder: "",
      required: false,
      options: type === "select" || type === "radio" || type === "checkbox" ? ["Вариант 1", "Вариант 2"] : undefined,
    };
    update({ fields: [...doc.fields, f] });
  };

  const updateField = (id: string, patch: Partial<Field>) => {
    update({ fields: doc.fields.map(f => f.id === id ? { ...f, ...patch } : f) });
  };

  const removeField = (id: string) => update({ fields: doc.fields.filter(f => f.id !== id) });

  const download = (content: string, name: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  const exportHTML = () => {
    const fieldsHtml = doc.fields.map(f => {
      const req = f.required ? ' required' : '';
      if (f.type === "textarea") return `<label><strong>${f.label}${f.required ? ' *' : ''}</strong><br><textarea name="${f.id}" placeholder="${f.placeholder || ''}" rows="4"${req}></textarea></label><br><br>`;
      if (f.type === "select") return `<label><strong>${f.label}${f.required ? ' *' : ''}</strong><br><select name="${f.id}"${req}>${(f.options || []).map(o => `<option>${o}</option>`).join("")}</select></label><br><br>`;
      if (f.type === "radio") return `<fieldset><legend>${f.label}${f.required ? ' *' : ''}</legend>${(f.options || []).map(o => `<label><input type="radio" name="${f.id}" value="${o}"${req}> ${o}</label><br>`).join("")}</fieldset><br>`;
      if (f.type === "checkbox") return `<fieldset><legend>${f.label}</legend>${(f.options || []).map(o => `<label><input type="checkbox" name="${f.id}" value="${o}"> ${o}</label><br>`).join("")}</fieldset><br>`;
      return `<label><strong>${f.label}${f.required ? ' *' : ''}</strong><br><input type="${f.type}" name="${f.id}" placeholder="${f.placeholder || ''}"${req}></label><br><br>`;
    }).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${doc.title}</title><style>body{font-family:Arial;max-width:600px;margin:40px auto;padding:20px}input,textarea,select{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px}fieldset{border:1px solid #ddd;padding:12px;border-radius:4px}button{background:#4ade80;color:#000;padding:12px 24px;border:none;border-radius:4px;cursor:pointer;font-weight:bold}</style></head><body><h1>${doc.title}</h1><p>${doc.description}</p><form>${fieldsHtml}<button type="submit">Отправить</button></form></body></html>`;
    download(html, `${doc.title}.html`, "text/html");
  };

  const exportJSON = () => download(JSON.stringify(doc, null, 2), `${doc.title}.json`, "application/json");

  const submitAnswers = () => {
    const text = Object.entries(answers).map(([id, v]) => {
      const f = doc.fields.find(x => x.id === id);
      return `${f?.label}: ${Array.isArray(v) ? v.join(", ") : v}`;
    }).join("\n");
    alert("Ответы:\n\n" + (text || "(пусто)"));
  };

  const FIELD_TYPES: { type: FieldType; icon: string; label: string }[] = [
    { type: "text", icon: "Type", label: "Текст" },
    { type: "textarea", icon: "AlignLeft", label: "Абзац" },
    { type: "email", icon: "Mail", label: "Email" },
    { type: "number", icon: "Hash", label: "Число" },
    { type: "date", icon: "Calendar", label: "Дата" },
    { type: "select", icon: "ChevronDown", label: "Список" },
    { type: "radio", icon: "Circle", label: "Один вариант" },
    { type: "checkbox", icon: "CheckSquare", label: "Много вариантов" },
  ];

  return (
    <div className="min-h-screen bg-[#f3f2f1] text-black flex flex-col">
      <div className="bg-[#6264a7] text-white">
        <div className="flex items-center gap-3 px-4 py-2">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:bg-white/10 px-3 py-1.5 rounded text-sm">
            <Icon name="ArrowLeft" size={16} /> На главную
          </button>
          <div className="w-px h-6 bg-white/20" />
          <Icon name="ClipboardList" size={18} />
          <input value={doc.title} onChange={e => update({ title: e.target.value })}
            className="bg-transparent border-b border-transparent hover:border-white/30 focus:border-white focus:outline-none px-2 py-1 text-sm font-medium min-w-[200px]" />
          <span className="text-xs text-white/70 ml-2">{saved ? "✓ Сохранено" : "● Не сохранено"}</span>
          <div className="flex-1" />
          <span className="text-xs text-white/70">Browser Office Forms</span>
        </div>
        <div className="flex items-center gap-1 px-4 py-1 border-t border-white/10 text-sm">
          <button onClick={() => setShowTpl(!showTpl)} className="px-3 py-1 hover:bg-white/10 rounded">Шаблоны</button>
          <button onClick={handleSave} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1"><Icon name="Save" size={14} /> Сохранить</button>
          <button onClick={() => setMode(mode === "edit" ? "preview" : "edit")} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1">
            <Icon name={mode === "edit" ? "Eye" : "Pencil"} size={14} /> {mode === "edit" ? "Предпросмотр" : "Редактор"}
          </button>
          <button onClick={exportHTML} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1"><Icon name="Download" size={14} /> HTML</button>
          <button onClick={exportJSON} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1"><Icon name="Code" size={14} /> JSON</button>
        </div>
      </div>

      {showTpl && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex gap-2 flex-wrap">
          {Object.entries(TEMPLATES).map(([k, t]) => (
            <button key={k} onClick={() => { setDoc(t); setShowTpl(false); setSaved(false); }} className="px-4 py-2 border border-gray-300 rounded hover:border-[#6264a7] text-sm flex items-center gap-2">
              <Icon name="ClipboardList" size={14} className="text-[#6264a7]" /> {t.title}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {mode === "edit" ? (
            <>
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-[#6264a7]">
                <input value={doc.title} onChange={e => update({ title: e.target.value })} className="w-full text-2xl font-bold border-none focus:outline-none mb-2" />
                <input value={doc.description} onChange={e => update({ description: e.target.value })} className="w-full text-gray-600 border-none focus:outline-none" />
              </div>

              {doc.fields.map((f, i) => (
                <div key={f.id} className="bg-white rounded-lg shadow p-5 relative group">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-400">{i + 1}.</span>
                    <input value={f.label} onChange={e => updateField(f.id, { label: e.target.value })} className="flex-1 font-medium border-b border-gray-200 focus:border-[#6264a7] focus:outline-none py-1" />
                    <select value={f.type} onChange={e => updateField(f.id, { type: e.target.value as FieldType })} className="text-xs border border-gray-200 rounded px-2 py-1">
                      {FIELD_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
                    </select>
                    <label className="flex items-center gap-1 text-xs text-gray-500">
                      <input type="checkbox" checked={f.required || false} onChange={e => updateField(f.id, { required: e.target.checked })} />
                      Обязат.
                    </label>
                    <button onClick={() => removeField(f.id)} className="text-red-500 hover:bg-red-50 rounded p-1"><Icon name="Trash2" size={14} /></button>
                  </div>

                  {(f.type === "select" || f.type === "radio" || f.type === "checkbox") && (
                    <div className="space-y-2 mt-2">
                      {(f.options || []).map((o, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-gray-400">•</span>
                          <input value={o} onChange={e => {
                            const opts = [...(f.options || [])]; opts[idx] = e.target.value;
                            updateField(f.id, { options: opts });
                          }} className="flex-1 border-b border-gray-200 focus:border-[#6264a7] focus:outline-none text-sm py-1" />
                          <button onClick={() => {
                            const opts = (f.options || []).filter((_, i) => i !== idx);
                            updateField(f.id, { options: opts });
                          }} className="text-gray-400 hover:text-red-500"><Icon name="X" size={14} /></button>
                        </div>
                      ))}
                      <button onClick={() => updateField(f.id, { options: [...(f.options || []), `Вариант ${(f.options?.length || 0) + 1}`] })}
                        className="text-[#6264a7] text-sm hover:underline">+ Добавить вариант</button>
                    </div>
                  )}
                </div>
              ))}

              <div className="bg-white rounded-lg shadow p-5">
                <div className="text-sm font-medium text-gray-600 mb-3">Добавить поле:</div>
                <div className="flex flex-wrap gap-2">
                  {FIELD_TYPES.map(t => (
                    <button key={t.type} onClick={() => addField(t.type)} className="px-3 py-2 border border-gray-200 rounded hover:border-[#6264a7] hover:bg-[#6264a7]/5 text-sm flex items-center gap-1.5">
                      <Icon name={t.icon} size={14} fallback="Plus" /> {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 border-t-4 border-[#6264a7]">
              <h1 className="text-2xl font-bold mb-2">{doc.title}</h1>
              <p className="text-gray-600 mb-6">{doc.description}</p>
              <div className="space-y-5">
                {doc.fields.map(f => (
                  <div key={f.id}>
                    <label className="block font-medium mb-2">{f.label} {f.required && <span className="text-red-500">*</span>}</label>
                    {f.type === "textarea" && <textarea rows={3} placeholder={f.placeholder} value={(answers[f.id] as string) || ""} onChange={e => setAnswers({ ...answers, [f.id]: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#6264a7]" />}
                    {(f.type === "text" || f.type === "email" || f.type === "number" || f.type === "date") && <input type={f.type} placeholder={f.placeholder} value={(answers[f.id] as string) || ""} onChange={e => setAnswers({ ...answers, [f.id]: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#6264a7]" />}
                    {f.type === "select" && <select value={(answers[f.id] as string) || ""} onChange={e => setAnswers({ ...answers, [f.id]: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2"><option value="">— выберите —</option>{(f.options || []).map(o => <option key={o}>{o}</option>)}</select>}
                    {f.type === "radio" && (f.options || []).map(o => (
                      <label key={o} className="flex items-center gap-2 mb-1"><input type="radio" name={f.id} checked={answers[f.id] === o} onChange={() => setAnswers({ ...answers, [f.id]: o })} /> {o}</label>
                    ))}
                    {f.type === "checkbox" && (f.options || []).map(o => {
                      const arr = (answers[f.id] as string[]) || [];
                      return (
                        <label key={o} className="flex items-center gap-2 mb-1">
                          <input type="checkbox" checked={arr.includes(o)} onChange={e => {
                            const next = e.target.checked ? [...arr, o] : arr.filter(x => x !== o);
                            setAnswers({ ...answers, [f.id]: next });
                          }} /> {o}
                        </label>
                      );
                    })}
                  </div>
                ))}
                <button onClick={submitAnswers} className="w-full py-3 rounded bg-[#6264a7] text-white font-semibold hover:opacity-90">Отправить</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Forms;