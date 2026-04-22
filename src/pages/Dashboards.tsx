import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const STORAGE_KEY = "officekit_dashboard";

type Widget = {
  id: string;
  type: "stat" | "bar" | "line" | "pie" | "area";
  title: string;
  value?: string;
  change?: string;
  color: string;
  data?: { name: string; value: number; value2?: number }[];
};

const COLORS = ["#8b5cf6", "#06b6d4", "#f472b6", "#4ade80", "#fbbf24", "#f87171"];

const TEMPLATES: Record<string, { title: string; widgets: Widget[] }> = {
  sales: {
    title: "Продажи",
    widgets: [
      { id: "1", type: "stat", title: "Выручка", value: "12.4M ₽", change: "+24%", color: "#8b5cf6" },
      { id: "2", type: "stat", title: "Заказы", value: "1 240", change: "+18%", color: "#06b6d4" },
      { id: "3", type: "stat", title: "Конверсия", value: "4.7%", change: "+0.8%", color: "#4ade80" },
      { id: "4", type: "stat", title: "Средний чек", value: "10 000 ₽", change: "+5%", color: "#f472b6" },
      { id: "5", type: "line", title: "Динамика продаж", color: "#8b5cf6", data: [
        { name: "Янв", value: 400 }, { name: "Фев", value: 600 }, { name: "Мар", value: 550 },
        { name: "Апр", value: 780 }, { name: "Май", value: 900 }, { name: "Июн", value: 1100 },
      ]},
      { id: "6", type: "bar", title: "По каналам", color: "#06b6d4", data: [
        { name: "Сайт", value: 450 }, { name: "Магазин", value: 320 },
        { name: "Маркет", value: 280 }, { name: "Партнёры", value: 190 },
      ]},
      { id: "7", type: "pie", title: "Категории", color: "#f472b6", data: [
        { name: "Электроника", value: 400 }, { name: "Одежда", value: 300 },
        { name: "Дом", value: 200 }, { name: "Спорт", value: 100 },
      ]},
    ],
  },
  analytics: {
    title: "Аналитика сайта",
    widgets: [
      { id: "1", type: "stat", title: "Посетители", value: "48 320", change: "+12%", color: "#8b5cf6" },
      { id: "2", type: "stat", title: "Просмотры", value: "124 500", change: "+18%", color: "#06b6d4" },
      { id: "3", type: "stat", title: "Время на сайте", value: "3:42", change: "+8%", color: "#4ade80" },
      { id: "4", type: "stat", title: "Отказы", value: "32%", change: "-4%", color: "#f472b6" },
      { id: "5", type: "area", title: "Трафик за месяц", color: "#8b5cf6", data: Array.from({length:12}, (_,i) => ({ name: `${i+1}`, value: 200 + Math.round(Math.random()*300) })) },
      { id: "6", type: "pie", title: "Источники", color: "#06b6d4", data: [
        { name: "Органика", value: 52 }, { name: "Прямой", value: 23 },
        { name: "Соцсети", value: 15 }, { name: "Реклама", value: 10 },
      ]},
    ],
  },
  kpi: {
    title: "KPI команды",
    widgets: [
      { id: "1", type: "stat", title: "Выполнено задач", value: "87", change: "+12", color: "#4ade80" },
      { id: "2", type: "stat", title: "В работе", value: "23", change: "—", color: "#fbbf24" },
      { id: "3", type: "stat", title: "Просрочено", value: "5", change: "-2", color: "#f87171" },
      { id: "4", type: "bar", title: "По сотрудникам", color: "#8b5cf6", data: [
        { name: "Иванов", value: 24, value2: 18 }, { name: "Петров", value: 19, value2: 15 },
        { name: "Сидоров", value: 22, value2: 20 }, { name: "Смирнов", value: 16, value2: 12 },
      ]},
    ],
  },
};

const Dashboards = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("Продажи");
  const [widgets, setWidgets] = useState<Widget[]>(TEMPLATES.sales.widgets);
  const [saved, setSaved] = useState(true);
  const [showTpl, setShowTpl] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        setTitle(d.title); setWidgets(d.widgets);
      } catch { /* noop */ }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ title, widgets }));
    setSaved(true);
  };

  const loadTpl = (k: string) => {
    setTitle(TEMPLATES[k].title);
    setWidgets(TEMPLATES[k].widgets);
    setShowTpl(false);
    setSaved(false);
  };

  const download = (content: string, name: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => download(JSON.stringify({ title, widgets }, null, 2), `${title}.json`, "application/json");

  const addStat = () => {
    setWidgets([...widgets, { id: Date.now().toString(), type: "stat", title: "Новая метрика", value: "0", change: "+0%", color: COLORS[widgets.length % COLORS.length] }]);
    setSaved(false);
  };

  const removeWidget = (id: string) => { setWidgets(widgets.filter(w => w.id !== id)); setSaved(false); };

  const renderChart = (w: Widget) => {
    if (w.type === "bar") return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={w.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" stroke="#888" fontSize={12} />
          <YAxis stroke="#888" fontSize={12} />
          <Tooltip />
          <Bar dataKey="value" fill={w.color} radius={[6, 6, 0, 0]} />
          {w.data?.[0]?.value2 !== undefined && <Bar dataKey="value2" fill="#06b6d4" radius={[6, 6, 0, 0]} />}
        </BarChart>
      </ResponsiveContainer>
    );
    if (w.type === "line") return (
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={w.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" stroke="#888" fontSize={12} />
          <YAxis stroke="#888" fontSize={12} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke={w.color} strokeWidth={3} dot={{ fill: w.color, r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    );
    if (w.type === "area") return (
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={w.data}>
          <defs>
            <linearGradient id={`g-${w.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={w.color} stopOpacity={0.6} />
              <stop offset="100%" stopColor={w.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" stroke="#888" fontSize={12} />
          <YAxis stroke="#888" fontSize={12} />
          <Tooltip />
          <Area type="monotone" dataKey="value" stroke={w.color} strokeWidth={2} fill={`url(#g-${w.id})`} />
        </AreaChart>
      </ResponsiveContainer>
    );
    if (w.type === "pie") return (
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={w.data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
            {w.data?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
    return null;
  };

  const stats = widgets.filter(w => w.type === "stat");
  const charts = widgets.filter(w => w.type !== "stat");

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <div className="bg-slate-900 border-b border-white/10">
        <div className="flex items-center gap-3 px-4 py-2">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:bg-white/10 px-3 py-1.5 rounded text-sm">
            <Icon name="ArrowLeft" size={16} /> На главную
          </button>
          <div className="w-px h-6 bg-white/20" />
          <Icon name="BarChart3" size={18} className="text-purple-400" />
          <input value={title} onChange={e => { setTitle(e.target.value); setSaved(false); }}
            className="bg-transparent border-b border-transparent hover:border-white/30 focus:border-white focus:outline-none px-2 py-1 text-sm font-medium min-w-[200px]" />
          <span className="text-xs text-white/50 ml-2">{saved ? "✓ Сохранено" : "● Не сохранено"}</span>
          <div className="flex-1" />
          <span className="text-xs text-white/50">OfficeKit Dashboard</span>
        </div>
        <div className="flex items-center gap-1 px-4 py-1 border-t border-white/5 text-sm">
          <button onClick={() => setShowTpl(!showTpl)} className="px-3 py-1 hover:bg-white/10 rounded">Шаблоны</button>
          <button onClick={handleSave} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1"><Icon name="Save" size={14} /> Сохранить</button>
          <button onClick={addStat} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1"><Icon name="Plus" size={14} /> Метрика</button>
          <button onClick={exportJSON} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1"><Icon name="Download" size={14} /> JSON</button>
          <button onClick={() => window.print()} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1"><Icon name="Printer" size={14} /> PDF</button>
        </div>
      </div>

      {showTpl && (
        <div className="bg-slate-900 border-b border-white/10 px-4 py-3 flex gap-2 flex-wrap">
          {Object.entries(TEMPLATES).map(([k, t]) => (
            <button key={k} onClick={() => loadTpl(k)} className="px-4 py-2 border border-white/10 rounded hover:border-purple-500 text-sm flex items-center gap-2">
              <Icon name="BarChart3" size={14} className="text-purple-400" /> {t.title}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        {stats.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map(w => (
              <div key={w.id} className="relative group bg-slate-900 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors">
                <button onClick={() => removeWidget(w.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400"><Icon name="X" size={14} /></button>
                <input value={w.title} onChange={e => { setWidgets(widgets.map(x => x.id === w.id ? { ...x, title: e.target.value } : x)); setSaved(false); }} className="bg-transparent text-sm text-white/50 border-none focus:outline-none mb-2 w-full" />
                <input value={w.value || ""} onChange={e => { setWidgets(widgets.map(x => x.id === w.id ? { ...x, value: e.target.value } : x)); setSaved(false); }} className="bg-transparent text-3xl font-bold border-none focus:outline-none w-full" style={{ color: w.color }} />
                <div className="text-xs text-white/50 mt-1">{w.change}</div>
                <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl" style={{ background: w.color }} />
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-4">
          {charts.map(w => (
            <div key={w.id} className="relative group bg-slate-900 border border-white/10 rounded-2xl p-5">
              <button onClick={() => removeWidget(w.id)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400"><Icon name="X" size={14} /></button>
              <h3 className="font-semibold mb-4">{w.title}</h3>
              {renderChart(w)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboards;
