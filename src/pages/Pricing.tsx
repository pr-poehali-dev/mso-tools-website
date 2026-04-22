import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";
import PremiumModal from "@/components/PremiumModal";
import AuthModal from "@/components/AuthModal";

const FEATURES_FREE = [
  "Базовые шаблоны (100+)",
  "Все 6 редакторов",
  "Сохранение в браузере",
  "Экспорт 5 файлов/сутки",
];

const FEATURES_PREMIUM = [
  "Все 500+ шаблонов",
  "ИИ-ассистент в редакторах",
  "Безлимитный экспорт",
  "Облачное хранилище",
  "Совместная работа",
  "Приоритетная поддержка",
];

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [premium, setPremium] = useState(false);
  const [auth, setAuth] = useState(false);

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="bg-slate-900/80 backdrop-blur border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5">
            <Icon name="ArrowLeft" size={16} /> На главную
          </button>
          <div className="w-px h-6 bg-white/10" />
          <span className="text-sm text-white">Тарифы</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="font-montserrat font-black text-5xl mb-4">Простые тарифы</h1>
          <p className="text-white/60 text-lg">Начните бесплатно — перейдите на Premium, когда нужен ИИ и безлимит.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="p-8 rounded-3xl border border-white/10 bg-white/5">
            <div className="text-white/60 text-sm mb-2">Бесплатно</div>
            <div className="text-5xl font-black mb-1">0 ₽</div>
            <div className="text-white/40 text-sm mb-6">Навсегда</div>
            <div className="space-y-3 mb-8">
              {FEATURES_FREE.map(f => (
                <div key={f} className="flex items-center gap-2 text-sm"><Icon name="Check" size={16} className="text-green-400" /> {f}</div>
              ))}
            </div>
            <button onClick={() => navigate("/")} className="w-full py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5">
              Начать бесплатно
            </button>
          </div>

          <div className="relative p-8 rounded-3xl border-2 border-yellow-500/40 bg-gradient-to-br from-purple-500/10 to-yellow-500/5">
            <div className="absolute -top-3 left-8 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-black">РЕКОМЕНДУЕМ</div>
            <div className="text-yellow-300 text-sm mb-2 font-semibold flex items-center gap-1"><Icon name="Sparkles" size={14} /> Premium</div>
            <div className="flex items-baseline gap-3 mb-1">
              <div className="text-5xl font-black">400 ₽</div>
              <div className="text-white/60 line-through text-lg">2 388 ₽</div>
            </div>
            <div className="text-white/40 text-sm mb-6">в год · или 199 ₽/мес</div>
            <div className="space-y-3 mb-8">
              {FEATURES_PREMIUM.map(f => (
                <div key={f} className="flex items-center gap-2 text-sm">
                  <Icon name="Check" size={16} className="text-yellow-400" /> {f}
                </div>
              ))}
            </div>
            <button onClick={() => { if (!user) setAuth(true); else setPremium(true); }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold hover:opacity-90">
              Оформить Premium
            </button>
            <div className="text-center text-xs text-white/40 mt-3">Оплата через ЮMoney · Безопасно</div>
          </div>
        </div>

        <div className="mt-12 text-center text-white/50 text-sm">
          Возврат средств в течение 7 дней без вопросов. Остались вопросы? <button onClick={() => navigate("/")} className="text-purple-300 underline">Напишите нам</button>
        </div>
      </div>

      <AuthModal open={auth} onClose={() => setAuth(false)} />
      <PremiumModal open={premium} onClose={() => setPremium(false)} onNeedAuth={() => setAuth(true)} />
    </div>
  );
};

export default Pricing;
