import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Icon from "@/components/ui/icon";
import func2url from "../../backend/func2url.json";

type Props = { open: boolean; onClose: () => void; onNeedAuth: () => void };

const PremiumModal = ({ open, onClose, onNeedAuth }: Props) => {
  const { user, token, refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const buy = async (plan: "month" | "year") => {
    setError("");
    if (!user || !token) { onClose(); onNeedAuth(); return; }
    setBusy(true);
    try {
      const r = await fetch(func2url.payment, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ action: "create", plan }),
      });
      const data = await r.json();
      setBusy(false);
      if (data.error) { setError(data.error); return; }
      window.open(data.url, "_blank");
      setTimeout(() => refresh(), 30000);
    } catch {
      setBusy(false);
      setError("Ошибка. Попробуйте позже");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-purple-900/40 p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-bold mb-2">
              <Icon name="Sparkles" size={12} /> PREMIUM
            </div>
            <h2 className="font-bold text-3xl text-white">Browser Office Premium</h2>
            <p className="text-white/60 mt-2">ИИ-ассистент, безлимит шаблонов и экспорт без лимитов</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><Icon name="X" size={20} /></button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button onClick={() => buy("month")} disabled={busy}
            className="group p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-purple-500 hover:bg-purple-500/10 text-left transition-all">
            <div className="text-white/60 text-sm mb-2">На месяц</div>
            <div className="text-4xl font-black text-white mb-1">199 ₽</div>
            <div className="text-white/40 text-xs mb-4">Оплата раз в месяц</div>
            <div className="inline-flex items-center gap-1 text-purple-300 text-sm font-semibold">
              Купить через ЮMoney <Icon name="ArrowRight" size={14} />
            </div>
          </button>

          <button onClick={() => buy("year")} disabled={busy}
            className="relative group p-6 rounded-2xl border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-purple-500/20 hover:from-yellow-500/20 text-left transition-all">
            <div className="absolute -top-3 left-6 px-2 py-0.5 rounded bg-yellow-500 text-black text-xs font-bold">ВЫГОДНО −83%</div>
            <div className="text-white/60 text-sm mb-2">На год</div>
            <div className="text-4xl font-black text-white mb-1">400 ₽</div>
            <div className="text-white/40 text-xs mb-4">Всего ~33 ₽/мес</div>
            <div className="inline-flex items-center gap-1 text-yellow-300 text-sm font-semibold">
              Купить через ЮMoney <Icon name="ArrowRight" size={14} />
            </div>
          </button>
        </div>

        {error && <div className="text-red-400 text-sm mb-3">{error}</div>}

        <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
          <div className="text-white font-semibold mb-3 flex items-center gap-2">
            <Icon name="Bot" size={16} className="text-purple-400" /> Что входит в Premium:
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-white/70">
            <div className="flex items-center gap-2"><Icon name="Check" size={14} className="text-green-400" /> ИИ-ассистент в редакторах</div>
            <div className="flex items-center gap-2"><Icon name="Check" size={14} className="text-green-400" /> Все 500+ шаблонов</div>
            <div className="flex items-center gap-2"><Icon name="Check" size={14} className="text-green-400" /> Экспорт без лимитов</div>
            <div className="flex items-center gap-2"><Icon name="Check" size={14} className="text-green-400" /> Облачное хранилище</div>
            <div className="flex items-center gap-2"><Icon name="Check" size={14} className="text-green-400" /> Совместная работа</div>
            <div className="flex items-center gap-2"><Icon name="Check" size={14} className="text-green-400" /> Приоритетная поддержка</div>
          </div>
        </div>

        {busy && <div className="text-center text-white/50 mt-4 text-sm">Создаём счёт в ЮMoney...</div>}
      </div>
    </div>
  );
};

export default PremiumModal;
