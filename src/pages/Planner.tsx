import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import AIAssistant from "@/components/AIAssistant";

const STORAGE_KEY = "officekit_planner";

type Task = {
  id: string;
  title: string;
  desc?: string;
  status: "todo" | "progress" | "done";
  priority: "low" | "med" | "high";
  date?: string;
};

const COLS = [
  { id: "todo" as const, label: "К выполнению", color: "#64748b" },
  { id: "progress" as const, label: "В работе", color: "#f59e0b" },
  { id: "done" as const, label: "Готово", color: "#10b981" },
];

const PRIORITY = { low: { label: "Низкий", color: "#64748b" }, med: { label: "Средний", color: "#f59e0b" }, high: { label: "Высокий", color: "#ef4444" } };

const TEMPLATES: Record<string, { title: string; tasks: Task[] }> = {
  blank: { title: "Мои задачи", tasks: [] },
  week: {
    title: "План на неделю",
    tasks: [
      { id: "1", title: "Подготовить отчёт", status: "done", priority: "high", date: "2026-04-22" },
      { id: "2", title: "Встреча с клиентом", status: "progress", priority: "high", date: "2026-04-23" },
      { id: "3", title: "Код-ревью PR #142", status: "progress", priority: "med", date: "2026-04-23" },
      { id: "4", title: "Обновить документацию", status: "todo", priority: "low", date: "2026-04-24" },
      { id: "5", title: "Запустить рекламу", status: "todo", priority: "high", date: "2026-04-25" },
      { id: "6", title: "Подвести итоги недели", status: "todo", priority: "med", date: "2026-04-26" },
    ],
  },
  sprint: {
    title: "Sprint 24",
    tasks: [
      { id: "1", title: "API авторизации", desc: "JWT + refresh token", status: "done", priority: "high" },
      { id: "2", title: "Страница профиля", desc: "UI + интеграция", status: "progress", priority: "high" },
      { id: "3", title: "Email-уведомления", status: "progress", priority: "med" },
      { id: "4", title: "Мобильная адаптация", status: "todo", priority: "med" },
      { id: "5", title: "Unit-тесты покрытие", status: "todo", priority: "low" },
    ],
  },
  roadmap: {
    title: "Roadmap Q2",
    tasks: [
      { id: "1", title: "Релиз v2.0", status: "progress", priority: "high", date: "2026-04-30" },
      { id: "2", title: "AI-ассистент", status: "todo", priority: "high", date: "2026-05-15" },
      { id: "3", title: "Интеграция с CRM", status: "todo", priority: "med", date: "2026-05-30" },
      { id: "4", title: "Новые шаблоны", status: "todo", priority: "low", date: "2026-06-15" },
      { id: "5", title: "B2B-портал", status: "todo", priority: "high", date: "2026-06-30" },
    ],
  },
  marketing: {
    title: "Маркетинг-план",
    tasks: [
      { id: "1", title: "Стратегия на квартал", desc: "Определить KPI и каналы", status: "done", priority: "high" },
      { id: "2", title: "Запустить Я.Директ", desc: "Настройка и A/B тесты", status: "progress", priority: "high", date: "2026-04-25" },
      { id: "3", title: "Контент-план для блога", status: "progress", priority: "med" },
      { id: "4", title: "Email-рассылка", desc: "10 писем цикл", status: "todo", priority: "med", date: "2026-05-01" },
      { id: "5", title: "SEO-аудит", status: "todo", priority: "low" },
      { id: "6", title: "Партнёрская программа", status: "todo", priority: "high", date: "2026-05-15" },
    ],
  },
  moving: {
    title: "Переезд в офис",
    tasks: [
      { id: "1", title: "Выбрать помещение", status: "done", priority: "high" },
      { id: "2", title: "Подписать договор аренды", status: "progress", priority: "high", date: "2026-04-25" },
      { id: "3", title: "Заказать мебель", status: "todo", priority: "high", date: "2026-04-30" },
      { id: "4", title: "Перевезти технику", status: "todo", priority: "med", date: "2026-05-05" },
      { id: "5", title: "Подключить интернет", status: "todo", priority: "high", date: "2026-05-05" },
      { id: "6", title: "Уведомить сотрудников", status: "todo", priority: "med" },
    ],
  },
  travel: {
    title: "Планирование отпуска",
    tasks: [
      { id: "1", title: "Купить билеты", status: "done", priority: "high" },
      { id: "2", title: "Забронировать отель", status: "progress", priority: "high" },
      { id: "3", title: "Оформить страховку", status: "todo", priority: "high" },
      { id: "4", title: "Составить маршрут", status: "todo", priority: "med" },
      { id: "5", title: "Собрать чемодан", status: "todo", priority: "low" },
      { id: "6", title: "Поставить отпуск на работе", status: "todo", priority: "high" },
    ],
  },
  wedding: {
    title: "Организация мероприятия",
    tasks: [
      { id: "1", title: "Выбрать дату и место", status: "done", priority: "high" },
      { id: "2", title: "Составить список гостей", status: "progress", priority: "high" },
      { id: "3", title: "Разослать приглашения", status: "todo", priority: "high" },
      { id: "4", title: "Заказать кейтеринг", status: "todo", priority: "high" },
      { id: "5", title: "Найти фотографа", status: "todo", priority: "med" },
      { id: "6", title: "Подготовить программу", status: "todo", priority: "med" },
      { id: "7", title: "Арендовать оборудование", status: "todo", priority: "low" },
    ],
  },
  onboarding: {
    title: "Онбординг сотрудника",
    tasks: [
      { id: "1", title: "Подготовить рабочее место", status: "done", priority: "high" },
      { id: "2", title: "Оформить документы", status: "progress", priority: "high" },
      { id: "3", title: "Создать учётные записи", status: "progress", priority: "high" },
      { id: "4", title: "Провести welcome-встречу", status: "todo", priority: "med" },
      { id: "5", title: "Познакомить с командой", status: "todo", priority: "med" },
      { id: "6", title: "Задачи на первую неделю", status: "todo", priority: "high" },
      { id: "7", title: "Фидбек через 1 месяц", status: "todo", priority: "low" },
    ],
  },
};

const Planner = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("Мои задачи");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [saved, setSaved] = useState(true);
  const [showTpl, setShowTpl] = useState(false);
  const [view, setView] = useState<"board" | "list">("board");
  const [editing, setEditing] = useState<Task | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { const d = JSON.parse(raw); setTitle(d.title); setTasks(d.tasks); } catch { /* noop */ }
    }
  }, []);

  const handleSave = () => { localStorage.setItem(STORAGE_KEY, JSON.stringify({ title, tasks })); setSaved(true); };

  const loadTpl = (k: string) => {
    setTitle(TEMPLATES[k].title); setTasks(TEMPLATES[k].tasks); setShowTpl(false); setSaved(false);
  };

  const addTask = (status: Task["status"] = "todo") => {
    const t: Task = { id: Date.now().toString(), title: "Новая задача", status, priority: "med" };
    setTasks([...tasks, t]);
    setEditing(t);
    setSaved(false);
  };

  const updateTask = (id: string, patch: Partial<Task>) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...patch } : t));
    setSaved(false);
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    setEditing(null);
    setSaved(false);
  };

  const moveTask = (id: string, status: Task["status"]) => updateTask(id, { status });

  const download = (content: string, name: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => download(JSON.stringify({ title, tasks }, null, 2), `${title}.json`, "application/json");
  const exportMD = () => {
    const md = `# ${title}\n\n${COLS.map(col => `## ${col.label}\n\n${tasks.filter(t => t.status === col.id).map(t => `- [${t.status === 'done' ? 'x' : ' '}] **${t.title}**${t.date ? ` (${t.date})` : ''}${t.desc ? `\n  ${t.desc}` : ''}`).join("\n")}`).join("\n\n")}`;
    download(md, `${title}.md`, "text/markdown");
  };

  const done = tasks.filter(t => t.status === "done").length;
  const total = tasks.length;
  const progress = total ? Math.round(done / total * 100) : 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
        <div className="flex items-center gap-3 px-4 py-2">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:bg-white/10 px-3 py-1.5 rounded text-sm">
            <Icon name="ArrowLeft" size={16} /> На главную
          </button>
          <div className="w-px h-6 bg-white/20" />
          <Icon name="Calendar" size={18} />
          <input value={title} onChange={e => { setTitle(e.target.value); setSaved(false); }}
            className="bg-transparent border-b border-transparent hover:border-white/30 focus:border-white focus:outline-none px-2 py-1 text-sm font-medium min-w-[200px]" />
          <span className="text-xs text-white/80 ml-2">{saved ? "✓ Сохранено" : "● Не сохранено"}</span>
          <div className="flex-1" />
          <span className="text-xs text-white/80">Browser Office Planner</span>
        </div>
        <div className="flex items-center gap-1 px-4 py-1 border-t border-white/10 text-sm">
          <button onClick={() => setShowTpl(!showTpl)} className="px-3 py-1 hover:bg-white/10 rounded">Шаблоны</button>
          <button onClick={handleSave} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1"><Icon name="Save" size={14} /> Сохранить</button>
          <button onClick={() => addTask()} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1"><Icon name="Plus" size={14} /> Задача</button>
          <button onClick={() => setView(view === "board" ? "list" : "board")} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1">
            <Icon name={view === "board" ? "List" : "Columns3"} size={14} /> {view === "board" ? "Список" : "Доска"}
          </button>
          <button onClick={exportMD} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1"><Icon name="FileText" size={14} /> Markdown</button>
          <button onClick={exportJSON} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1"><Icon name="Code" size={14} /> JSON</button>
        </div>
      </div>

      {showTpl && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex gap-2 flex-wrap">
          {Object.entries(TEMPLATES).map(([k, t]) => (
            <button key={k} onClick={() => loadTpl(k)} className="px-4 py-2 border border-gray-300 rounded hover:border-cyan-600 text-sm flex items-center gap-2">
              <Icon name="Calendar" size={14} className="text-cyan-600" /> {t.title}
            </button>
          ))}
        </div>
      )}

      {/* Progress */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <div className="text-sm text-gray-600">Прогресс: <b>{done}/{total}</b></div>
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-sm font-semibold text-gray-700">{progress}%</div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {view === "board" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLS.map(col => (
              <div key={col.id} className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                    <h3 className="font-semibold text-sm">{col.label}</h3>
                    <span className="text-xs text-gray-400">{tasks.filter(t => t.status === col.id).length}</span>
                  </div>
                  <button onClick={() => addTask(col.id)} className="text-gray-400 hover:text-gray-700"><Icon name="Plus" size={16} /></button>
                </div>
                <div className="space-y-2">
                  {tasks.filter(t => t.status === col.id).map(t => (
                    <div key={t.id} onClick={() => setEditing(t)} className="group p-3 rounded-lg border border-gray-200 hover:border-cyan-500 hover:shadow-sm cursor-pointer bg-white">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="text-sm font-medium flex-1">{t.title}</div>
                        <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: PRIORITY[t.priority].color }} />
                      </div>
                      {t.desc && <div className="text-xs text-gray-500 mb-2 line-clamp-2">{t.desc}</div>}
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        {t.date ? <span className="flex items-center gap-1"><Icon name="Calendar" size={11} /> {t.date}</span> : <span />}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {COLS.filter(c => c.id !== t.status).map(c => (
                            <button key={c.id} onClick={e => { e.stopPropagation(); moveTask(t.id, c.id); }} className="px-1.5 py-0.5 rounded hover:bg-gray-100" title={`→ ${c.label}`}>
                              <Icon name={c.id === "done" ? "Check" : c.id === "progress" ? "Clock" : "Circle"} size={11} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Задача</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Приоритет</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Дата</th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id} onClick={() => setEditing(t)} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ background: COLS.find(c => c.id === t.status)?.color }} />
                        {COLS.find(c => c.id === t.status)?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">{t.title}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: PRIORITY[t.priority].color + "20", color: PRIORITY[t.priority].color }}>
                        {PRIORITY[t.priority].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{t.date || "—"}</td>
                    <td className="px-4 py-3">
                      <button onClick={e => { e.stopPropagation(); removeTask(t.id); }} className="text-gray-400 hover:text-red-500"><Icon name="Trash2" size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Редактирование задачи</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-700"><Icon name="X" size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Название</label>
                <input value={editing.title} onChange={e => { updateTask(editing.id, { title: e.target.value }); setEditing({ ...editing, title: e.target.value }); }} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Описание</label>
                <textarea value={editing.desc || ""} onChange={e => { updateTask(editing.id, { desc: e.target.value }); setEditing({ ...editing, desc: e.target.value }); }} rows={3} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-cyan-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Статус</label>
                  <select value={editing.status} onChange={e => { updateTask(editing.id, { status: e.target.value as Task["status"] }); setEditing({ ...editing, status: e.target.value as Task["status"] }); }} className="w-full border border-gray-300 rounded px-3 py-2">
                    {COLS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Приоритет</label>
                  <select value={editing.priority} onChange={e => { updateTask(editing.id, { priority: e.target.value as Task["priority"] }); setEditing({ ...editing, priority: e.target.value as Task["priority"] }); }} className="w-full border border-gray-300 rounded px-3 py-2">
                    <option value="low">Низкий</option><option value="med">Средний</option><option value="high">Высокий</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Дата</label>
                  <input type="date" value={editing.date || ""} onChange={e => { updateTask(editing.id, { date: e.target.value }); setEditing({ ...editing, date: e.target.value }); }} className="w-full border border-gray-300 rounded px-3 py-2" />
                </div>
              </div>
              <div className="flex gap-2 pt-3">
                <button onClick={() => removeTask(editing.id)} className="px-4 py-2 text-red-500 border border-red-200 rounded hover:bg-red-50 text-sm">Удалить</button>
                <div className="flex-1" />
                <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded text-sm font-medium">Готово</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <AIAssistant />
    </div>
  );
};

export default Planner;