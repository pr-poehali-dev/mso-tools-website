import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import AIAssistant from "@/components/AIAssistant";

const COLS = 20;
const ROWS = 50;
const STORAGE_KEY = "officekit_spreadsheet";

const colLabel = (i: number) => {
  let s = "";
  let n = i;
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
};

const TEMPLATES: Record<string, { title: string; data: Record<string, string> }> = {
  blank: { title: "Новая таблица", data: {} },
  budget: {
    title: "Бюджет месяца",
    data: {
      "0-0": "Категория", "0-1": "План", "0-2": "Факт", "0-3": "Разница",
      "1-0": "Зарплата", "1-1": "100000", "1-2": "100000", "1-3": "=C2-B2",
      "2-0": "Аренда", "2-1": "30000", "2-2": "30000", "2-3": "=C3-B3",
      "3-0": "Продукты", "3-1": "20000", "3-2": "18500", "3-3": "=C4-B4",
      "4-0": "Транспорт", "4-1": "5000", "4-2": "4200", "4-3": "=C5-B5",
      "5-0": "Развлечения", "5-1": "10000", "5-2": "7800", "5-3": "=C6-B6",
      "7-0": "ИТОГО", "7-1": "=SUM(B2:B6)", "7-2": "=SUM(C2:C6)", "7-3": "=C8-B8",
    },
  },
  estimate: {
    title: "Смета",
    data: {
      "0-0": "№", "0-1": "Наименование", "0-2": "Кол-во", "0-3": "Цена", "0-4": "Сумма",
      "1-0": "1", "1-1": "Материалы", "1-2": "10", "1-3": "500", "1-4": "=C2*D2",
      "2-0": "2", "2-1": "Работа", "2-2": "8", "2-3": "1200", "2-4": "=C3*D3",
      "3-0": "3", "3-1": "Доставка", "3-2": "1", "3-3": "2000", "3-4": "=C4*D4",
      "5-1": "ИТОГО:", "5-4": "=SUM(E2:E4)",
    },
  },
  kpi: {
    title: "KPI сотрудников",
    data: {
      "0-0": "Сотрудник", "0-1": "План", "0-2": "Факт", "0-3": "%",
      "1-0": "Иванов", "1-1": "100", "1-2": "95", "1-3": "=C2/B2*100",
      "2-0": "Петров", "2-1": "100", "2-2": "110", "2-3": "=C3/B3*100",
      "3-0": "Сидоров", "3-1": "100", "3-2": "87", "3-3": "=C4/B4*100",
      "4-0": "Смирнов", "4-1": "100", "4-2": "120", "4-3": "=C5/B5*100",
    },
  },
  invoice: {
    title: "Счёт на оплату",
    data: {
      "0-0": "Счёт № ___ от __.__.20__",
      "2-0": "№", "2-1": "Наименование", "2-2": "Кол-во", "2-3": "Цена", "2-4": "Сумма",
      "3-0": "1", "3-1": "Услуга 1", "3-2": "1", "3-3": "10000", "3-4": "=C4*D4",
      "4-0": "2", "4-1": "Услуга 2", "4-2": "2", "4-3": "5000", "4-4": "=C5*D5",
      "5-0": "3", "5-1": "Услуга 3", "5-2": "1", "5-3": "15000", "5-4": "=C6*D6",
      "7-3": "Итого:", "7-4": "=SUM(E4:E6)",
      "8-3": "НДС 20%:", "8-4": "=E8*0.2",
      "9-3": "Всего:", "9-4": "=E8+E9",
    },
  },
  salary: {
    title: "Расчёт зарплаты",
    data: {
      "0-0": "Сотрудник", "0-1": "Оклад", "0-2": "Премия", "0-3": "Итого", "0-4": "НДФЛ 13%", "0-5": "К выплате",
      "1-0": "Иванов И.", "1-1": "80000", "1-2": "20000", "1-3": "=B2+C2", "1-4": "=D2*0.13", "1-5": "=D2-E2",
      "2-0": "Петрова А.", "2-1": "65000", "2-2": "10000", "2-3": "=B3+C3", "2-4": "=D3*0.13", "2-5": "=D3-E3",
      "3-0": "Сидоров В.", "3-1": "90000", "3-2": "25000", "3-3": "=B4+C4", "3-4": "=D4*0.13", "3-5": "=D4-E4",
      "5-0": "ИТОГО:", "5-3": "=SUM(D2:D4)", "5-4": "=SUM(E2:E4)", "5-5": "=SUM(F2:F4)",
    },
  },
  inventory: {
    title: "Складской учёт",
    data: {
      "0-0": "Артикул", "0-1": "Товар", "0-2": "Остаток", "0-3": "Цена закупки", "0-4": "Цена продажи", "0-5": "Стоимость",
      "1-0": "A001", "1-1": "Товар 1", "1-2": "150", "1-3": "500", "1-4": "800", "1-5": "=C2*D2",
      "2-0": "A002", "2-1": "Товар 2", "2-2": "85", "2-3": "1200", "2-4": "1800", "2-5": "=C3*D3",
      "3-0": "A003", "3-1": "Товар 3", "3-2": "220", "3-3": "300", "3-4": "500", "3-5": "=C4*D4",
      "4-0": "A004", "4-1": "Товар 4", "4-2": "45", "4-3": "2500", "4-4": "3500", "4-5": "=C5*D5",
      "6-1": "ИТОГО склад:", "6-5": "=SUM(F2:F5)",
    },
  },
  credit: {
    title: "Кредитный калькулятор",
    data: {
      "0-0": "Параметры кредита",
      "2-0": "Сумма кредита (₽)", "2-1": "1000000",
      "3-0": "Срок (мес)", "3-1": "36",
      "4-0": "Ставка (%)", "4-1": "12",
      "6-0": "Ежемесячный платёж", "6-1": "=B3*(B5/1200)*(1+B5/1200)^B4/((1+B5/1200)^B4-1)",
      "7-0": "Переплата", "7-1": "=B7*B4-B3",
      "8-0": "Общая сумма", "8-1": "=B7*B4",
    },
  },
  grades: {
    title: "Журнал оценок",
    data: {
      "0-0": "Ученик", "0-1": "Матем.", "0-2": "Рус. яз.", "0-3": "История", "0-4": "Физика", "0-5": "Средний",
      "1-0": "Иванов", "1-1": "5", "1-2": "4", "1-3": "5", "1-4": "4", "1-5": "=AVG(B2:E2)",
      "2-0": "Петров", "2-1": "3", "2-2": "4", "2-3": "3", "2-4": "4", "2-5": "=AVG(B3:E3)",
      "3-0": "Сидоров", "3-1": "5", "3-2": "5", "3-3": "4", "3-4": "5", "3-5": "=AVG(B4:E4)",
      "4-0": "Смирнов", "4-1": "4", "4-2": "3", "4-3": "4", "4-4": "3", "4-5": "=AVG(B5:E5)",
      "6-0": "Средний по классу:", "6-5": "=AVG(F2:F5)",
    },
  },
  schedule: {
    title: "График смен",
    data: {
      "0-0": "Сотрудник", "0-1": "Пн", "0-2": "Вт", "0-3": "Ср", "0-4": "Чт", "0-5": "Пт", "0-6": "Часов",
      "1-0": "Иванов", "1-1": "8", "1-2": "8", "1-3": "8", "1-4": "8", "1-5": "8", "1-6": "=SUM(B2:F2)",
      "2-0": "Петров", "2-1": "8", "2-2": "0", "2-3": "8", "2-4": "8", "2-5": "8", "2-6": "=SUM(B3:F3)",
      "3-0": "Сидоров", "3-1": "0", "3-2": "8", "3-3": "8", "3-4": "8", "3-5": "8", "3-6": "=SUM(B4:F4)",
    },
  },
};

const parseRef = (ref: string) => {
  const m = ref.match(/^([A-Z]+)(\d+)$/);
  if (!m) return null;
  let col = 0;
  for (let i = 0; i < m[1].length; i++) col = col * 26 + (m[1].charCodeAt(i) - 64);
  return { row: parseInt(m[2]) - 1, col: col - 1 };
};

const evalFormula = (formula: string, data: Record<string, string>, visited = new Set<string>()): string => {
  if (!formula.startsWith("=")) return formula;
  let expr = formula.slice(1).toUpperCase();

  expr = expr.replace(/SUM\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)/g, (_, c1, r1, c2, r2) => {
    const start = parseRef(c1 + r1);
    const end = parseRef(c2 + r2);
    if (!start || !end) return "0";
    let sum = 0;
    for (let r = start.row; r <= end.row; r++) {
      for (let c = start.col; c <= end.col; c++) {
        const v = getCellValue(`${r}-${c}`, data, visited);
        const n = parseFloat(v);
        if (!isNaN(n)) sum += n;
      }
    }
    return String(sum);
  });

  expr = expr.replace(/AVG\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)/g, (_, c1, r1, c2, r2) => {
    const start = parseRef(c1 + r1);
    const end = parseRef(c2 + r2);
    if (!start || !end) return "0";
    let sum = 0, cnt = 0;
    for (let r = start.row; r <= end.row; r++) {
      for (let c = start.col; c <= end.col; c++) {
        const v = getCellValue(`${r}-${c}`, data, visited);
        const n = parseFloat(v);
        if (!isNaN(n)) { sum += n; cnt++; }
      }
    }
    return cnt ? String(sum / cnt) : "0";
  });

  expr = expr.replace(/([A-Z]+)(\d+)/g, (_, col, row) => {
    const ref = parseRef(col + row);
    if (!ref) return "0";
    const v = getCellValue(`${ref.row}-${ref.col}`, data, visited);
    const n = parseFloat(v);
    return isNaN(n) ? "0" : String(n);
  });

  try {
     
    const r = Function(`"use strict"; return (${expr})`)();
    return String(r);
  } catch {
    return "#ERR";
  }
};

const getCellValue = (key: string, data: Record<string, string>, visited = new Set<string>()): string => {
  if (visited.has(key)) return "#LOOP";
  const raw = data[key] || "";
  if (raw.startsWith("=")) {
    visited.add(key);
    const r = evalFormula(raw, data, visited);
    visited.delete(key);
    return r;
  }
  return raw;
};

const Spreadsheet = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("Новая таблица");
  const [active, setActive] = useState<{ row: number; col: number } | null>(null);
  const [editing, setEditing] = useState<string>("");
  const [saved, setSaved] = useState(true);
  const [showTpl, setShowTpl] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        setData(d.data || {});
        setTitle(d.title || "Новая таблица");
      } catch { /* noop */ }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ title, data }));
    setSaved(true);
  };

  const download = (content: string, name: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const rows: string[] = [];
    let maxR = 0, maxC = 0;
    Object.keys(data).forEach(k => {
      const [r, c] = k.split("-").map(Number);
      if (r > maxR) maxR = r; if (c > maxC) maxC = c;
    });
    for (let r = 0; r <= maxR; r++) {
      const row: string[] = [];
      for (let c = 0; c <= maxC; c++) {
        const v = getCellValue(`${r}-${c}`, data);
        row.push(`"${v.replace(/"/g, '""')}"`);
      }
      rows.push(row.join(","));
    }
    download("\ufeff" + rows.join("\n"), `${title}.csv`, "text/csv;charset=utf-8");
  };

  const exportXLS = () => {
    let html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1">`;
    let maxR = 0, maxC = 0;
    Object.keys(data).forEach(k => {
      const [r, c] = k.split("-").map(Number);
      if (r > maxR) maxR = r; if (c > maxC) maxC = c;
    });
    for (let r = 0; r <= maxR; r++) {
      html += "<tr>";
      for (let c = 0; c <= maxC; c++) html += `<td>${getCellValue(`${r}-${c}`, data)}</td>`;
      html += "</tr>";
    }
    html += "</table></body></html>";
    download(html, `${title}.xls`, "application/vnd.ms-excel");
  };

  const updateCell = (key: string, value: string) => {
    setData(prev => {
      const next = { ...prev };
      if (value === "") delete next[key]; else next[key] = value;
      return next;
    });
    setSaved(false);
  };

  const loadTpl = (k: string) => {
    const t = TEMPLATES[k];
    setTitle(t.title);
    setData(t.data);
    setShowTpl(false);
    setSaved(false);
  };

  const clearAll = () => {
    if (!confirm("Очистить таблицу?")) return;
    setData({}); setTitle("Новая таблица"); localStorage.removeItem(STORAGE_KEY); setSaved(true);
  };

  const onCellClick = (r: number, c: number) => {
    setActive({ row: r, col: c });
    setEditing(data[`${r}-${c}`] || "");
  };

  const commit = () => {
    if (!active) return;
    updateCell(`${active.row}-${active.col}`, editing);
  };

  return (
    <div className="min-h-screen bg-[#f3f2f1] text-black flex flex-col">
      <div className="bg-[#217346] text-white">
        <div className="flex items-center gap-3 px-4 py-2">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:bg-white/10 px-3 py-1.5 rounded text-sm">
            <Icon name="ArrowLeft" size={16} /> На главную
          </button>
          <div className="w-px h-6 bg-white/20" />
          <Icon name="Table2" size={18} />
          <input value={title} onChange={e => { setTitle(e.target.value); setSaved(false); }}
            className="bg-transparent border-b border-transparent hover:border-white/30 focus:border-white focus:outline-none px-2 py-1 text-sm font-medium min-w-[200px]" />
          <span className="text-xs text-white/70 ml-2">{saved ? "✓ Сохранено" : "● Не сохранено"}</span>
          <div className="flex-1" />
          <span className="text-xs text-white/70">Browser Office Excel</span>
        </div>
        <div className="flex items-center gap-1 px-4 py-1 border-t border-white/10 text-sm">
          <button onClick={() => setShowTpl(!showTpl)} className="px-3 py-1 hover:bg-white/10 rounded">Шаблоны</button>
          <button onClick={handleSave} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1"><Icon name="Save" size={14} /> Сохранить</button>
          <button onClick={exportXLS} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1"><Icon name="Download" size={14} /> Excel</button>
          <button onClick={exportCSV} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1"><Icon name="FileText" size={14} /> CSV</button>
          <button onClick={() => window.print()} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1"><Icon name="Printer" size={14} /> Печать</button>
          <button onClick={clearAll} className="px-3 py-1 hover:bg-white/10 rounded flex items-center gap-1"><Icon name="Trash2" size={14} /> Очистить</button>
        </div>
      </div>

      {showTpl && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex gap-2 flex-wrap">
          {Object.entries(TEMPLATES).map(([k, t]) => (
            <button key={k} onClick={() => loadTpl(k)} className="px-4 py-2 border border-gray-300 rounded hover:border-[#217346] text-sm flex items-center gap-2">
              <Icon name="Table2" size={14} className="text-[#217346]" /> {t.title}
            </button>
          ))}
        </div>
      )}

      {/* Formula bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2">
        <div className="px-3 py-1 border border-gray-300 rounded bg-gray-50 text-sm font-mono min-w-[80px] text-center">
          {active ? `${colLabel(active.col)}${active.row + 1}` : "—"}
        </div>
        <span className="text-gray-400">fx</span>
        <input
          ref={inputRef}
          value={editing}
          onChange={e => setEditing(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") { commit(); (e.target as HTMLInputElement).blur(); } }}
          placeholder="Введите значение или формулу (=SUM(A1:A5))"
          className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:border-[#217346]"
        />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 bg-gray-100 border border-gray-300 w-10"></th>
              {Array.from({ length: COLS }).map((_, c) => (
                <th key={c} className="sticky top-0 z-10 bg-gray-100 border border-gray-300 text-xs font-medium text-gray-600 min-w-[100px] h-7">
                  {colLabel(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }).map((_, r) => (
              <tr key={r}>
                <td className="sticky left-0 bg-gray-100 border border-gray-300 text-xs text-gray-600 text-center w-10 h-7">{r + 1}</td>
                {Array.from({ length: COLS }).map((_, c) => {
                  const key = `${r}-${c}`;
                  const isActive = active?.row === r && active?.col === c;
                  const v = getCellValue(key, data);
                  return (
                    <td
                      key={c}
                      onClick={() => onCellClick(r, c)}
                      className={`border border-gray-300 px-2 h-7 text-sm cursor-cell ${isActive ? "outline outline-2 outline-[#217346] bg-green-50" : "hover:bg-gray-50"}`}
                    >
                      {v}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-[#f3f2f1] border-t border-gray-300 px-4 py-1 text-xs text-gray-600">
        Формулы: =SUM(A1:A10), =AVG(A1:A10), =A1+B1, =A1*2
      </div>
      <AIAssistant />
    </div>
  );
};

export default Spreadsheet;