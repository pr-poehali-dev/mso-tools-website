import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

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
    </div>
  );
};

export default Spreadsheet;