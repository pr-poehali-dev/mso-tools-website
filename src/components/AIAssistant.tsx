import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Icon from "@/components/ui/icon";

type Props = { onInsert?: (text: string) => void };

const TEMPLATES: Record<string, string> = {
  "коммерческое предложение": "КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ\n\nУважаемый [Имя],\n\nБлагодарим за интерес к нашим услугам. Предлагаем следующие условия сотрудничества:\n\n• Услуга 1 — описание и цена\n• Услуга 2 — описание и цена\n• Услуга 3 — описание и цена\n\nИтоговая стоимость: [сумма] ₽\nСрок исполнения: [дней]\n\nС уважением,\n[Ваше имя]",
  "договор": "ДОГОВОР №___ от __.__.20__ г.\n\n[Организация], в лице [ФИО], действующего на основании Устава, именуемое в дальнейшем «Исполнитель», и [Организация 2], в лице [ФИО], именуемое в дальнейшем «Заказчик», заключили настоящий договор о нижеследующем:\n\n1. ПРЕДМЕТ ДОГОВОРА\n1.1. Исполнитель обязуется оказать услуги...\n\n2. СТОИМОСТЬ И ПОРЯДОК РАСЧЁТОВ\n2.1. Общая стоимость работ составляет...",
  "письмо": "Уважаемый [Имя Отчество]!\n\nБлагодарим вас за обращение в нашу компанию.\n\nМы внимательно изучили ваш запрос и готовы предложить решение. [Описание предложения]\n\nБудем рады ответить на любые вопросы.\n\nС уважением,\n[Ваше имя]\n[Должность]",
  "идея": "5 ИДЕЙ ДЛЯ ВАШЕГО ПРОЕКТА:\n\n1. Анализ целевой аудитории — определите ключевые сегменты\n2. Уникальное торговое предложение — что отличает вас от конкурентов\n3. Контент-стратегия — регулярные публикации и SEO\n4. Лояльность клиентов — программы поощрения\n5. Автоматизация процессов — экономия времени и ресурсов",
};

const AIAssistant = ({ onInsert }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);

  const isPremium = user?.is_premium;

  const ask = async () => {
    setBusy(true);
    setTimeout(() => {
      const key = Object.keys(TEMPLATES).find(k => prompt.toLowerCase().includes(k));
      if (key) setAnswer(TEMPLATES[key]);
      else setAnswer(`Вот черновик по запросу "${prompt}":\n\n[Вступление — опишите контекст]\n\nОсновная часть:\n• Пункт 1 — ключевая мысль\n• Пункт 2 — развитие темы\n• Пункт 3 — выводы\n\n[Заключение — призыв к действию]`);
      setBusy(false);
    }, 800);
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl shadow-purple-500/40 flex items-center justify-center hover:scale-110 transition-transform"
        title="ИИ-ассистент">
        <Icon name="Sparkles" size={22} className="text-white" />
        {!isPremium && <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 text-[10px] font-black text-black flex items-center justify-center">P</div>}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 bg-black/60" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Icon name="Sparkles" size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg">ИИ-ассистент</h3>
                <p className="text-xs text-white/50">Premium · генерация текстов и идей</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white"><Icon name="X" size={20} /></button>
            </div>

            {!isPremium ? (
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-5 text-center">
                <Icon name="Lock" size={32} className="mx-auto text-yellow-400 mb-3" />
                <h4 className="font-bold text-white mb-2">Доступно в Premium</h4>
                <p className="text-white/60 text-sm mb-4">ИИ поможет написать документ, сгенерировать идеи и подобрать формулировки.</p>
                <div className="text-white/80 text-sm">От <b className="text-yellow-300">33 ₽/мес</b> при оплате за год</div>
              </div>
            ) : (
              <>
                <div className="flex gap-2 flex-wrap mb-3">
                  {["коммерческое предложение", "договор", "письмо клиенту", "5 идей"].map(p => (
                    <button key={p} onClick={() => setPrompt(p)} className="px-3 py-1.5 rounded-full text-xs bg-white/5 border border-white/10 text-white/80 hover:bg-white/10">
                      {p}
                    </button>
                  ))}
                </div>
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
                  placeholder="Напишите, что нужно..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500 resize-none text-sm" />
                <button onClick={ask} disabled={busy || !prompt}
                  className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold disabled:opacity-50">
                  {busy ? "Думаю..." : "Сгенерировать"}
                </button>

                {answer && (
                  <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 max-h-60 overflow-y-auto">
                    <pre className="text-white/80 text-sm whitespace-pre-wrap font-sans">{answer}</pre>
                    {onInsert && (
                      <button onClick={() => { onInsert(answer); setOpen(false); }}
                        className="mt-3 px-4 py-2 rounded-lg bg-purple-500 text-white text-sm">
                        Вставить в документ
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
