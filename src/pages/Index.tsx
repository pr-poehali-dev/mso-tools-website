import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";
import PremiumModal from "@/components/PremiumModal";
import AIAssistant from "@/components/AIAssistant";
import func2url from "../../backend/func2url.json";

const NAV_ITEMS = [
  { id: "home", label: "Главная" },
  { id: "tools", label: "Инструменты" },
  { id: "docs", label: "Документация" },
  { id: "contacts", label: "Контакты" },
];

const TOOLS = [
  { id: 1, icon: "FileText", color: "purple", label: "Документы", desc: "Готовые шаблоны договоров, актов, писем и отчётов", count: "120+ шаблонов", tags: ["Договор", "Акт", "Письмо", "Отчёт"] },
  { id: 2, icon: "Table2", color: "cyan", label: "Таблицы", desc: "Excel-шаблоны для бюджетов, смет и анализа данных", count: "85+ шаблонов", tags: ["Бюджет", "Смета", "KPI", "Отчёт"] },
  { id: 3, icon: "Monitor", color: "pink", label: "Презентации", desc: "Профессиональные слайды для бизнеса и питчей", count: "60+ шаблонов", tags: ["Питч", "Отчёт", "Обучение", "Продажи"] },
  { id: 4, icon: "ClipboardList", color: "green", label: "Формы и анкеты", desc: "Шаблоны опросов, анкет и чек-листов", count: "40+ шаблонов", tags: ["Опрос", "Анкета", "Чек-лист"] },
  { id: 5, icon: "BarChart3", color: "purple", label: "Дашборды", desc: "Готовые дашборды для аналитики и мониторинга", count: "30+ шаблонов", tags: ["Аналитика", "KPI", "Продажи"] },
  { id: 6, icon: "Calendar", color: "cyan", label: "Планировщики", desc: "Шаблоны планов, расписаний и дорожных карт", count: "45+ шаблонов", tags: ["Roadmap", "Sprint", "Неделя"] },
];

const DOC_ITEMS = [
  { slug: "start", icon: "BookOpen", title: "Быстрый старт", desc: "Как скачать и начать работать с шаблонами за 2 минуты" },
  { slug: "templates", icon: "Settings", title: "Настройка шаблонов", desc: "Инструкция по адаптации шаблонов под ваши задачи" },
  { slug: "formats", icon: "Download", title: "Форматы файлов", desc: "DOCX, XLSX, PPTX — совместимость со всеми редакторами" },
  { slug: "faq", icon: "HelpCircle", title: "FAQ", desc: "Ответы на частые вопросы о шаблонах и лицензиях" },
];

const colorMap: Record<string, { border: string; bg: string; text: string; tag: string }> = {
  purple: { border: "border-purple-500/30 hover:border-purple-500/60", bg: "bg-purple-500/10", text: "text-purple-400", tag: "bg-purple-500/15 text-purple-300" },
  cyan: { border: "border-cyan-500/30 hover:border-cyan-500/60", bg: "bg-cyan-500/10", text: "text-cyan-400", tag: "bg-cyan-500/15 text-cyan-300" },
  pink: { border: "border-pink-500/30 hover:border-pink-500/60", bg: "bg-pink-500/10", text: "text-pink-400", tag: "bg-pink-500/15 text-pink-300" },
  green: { border: "border-green-500/30 hover:border-green-500/60", bg: "bg-green-500/10", text: "text-green-400", tag: "bg-green-500/15 text-green-300" },
};

const Index = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [active, setActive] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [auth, setAuth] = useState(false);
  const [premium, setPremium] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  // Contact form
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cMessage, setCMessage] = useState("");
  const [cBusy, setCBusy] = useState(false);
  const [cStatus, setCStatus] = useState<{ ok?: boolean; msg: string } | null>(null);

  const TOOL_ROUTES: Record<number, string> = {
    1: "/tools/documents", 2: "/tools/spreadsheet", 3: "/tools/presentation",
    4: "/tools/forms", 5: "/tools/dashboards", 6: "/tools/planner",
  };

  const handleToolClick = (id: number) => {
    const route = TOOL_ROUTES[id];
    if (route) navigate(route);
  };

  const scrollTo = (id: string) => {
    setActive(id);
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll spy
  const manualScrollRef = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      if (Date.now() - manualScrollRef.current < 800) return;
      const sections = NAV_ITEMS.map(n => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
      const y = window.scrollY + 120;
      let current = "home";
      for (const s of sections) {
        if (s.offsetTop <= y) current = s.id;
      }
      setActive(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const smoothScroll = (id: string) => {
    manualScrollRef.current = Date.now();
    scrollTo(id);
  };

  const submitContact = async () => {
    setCStatus(null);
    if (!cName || !cEmail || !cMessage) { setCStatus({ msg: "Заполните все поля" }); return; }
    setCBusy(true);
    try {
      const r = await fetch(func2url.contact, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cName, email: cEmail, message: cMessage }),
      });
      const data = await r.json();
      setCBusy(false);
      if (data.error) { setCStatus({ msg: data.error }); return; }
      setCStatus({ ok: true, msg: "Сообщение отправлено! Мы ответим на ваш email." });
      setCName(""); setCEmail(""); setCMessage("");
    } catch {
      setCBusy(false);
      setCStatus({ msg: "Ошибка сети. Попробуйте позже." });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-pink-500/5 blur-[100px]" />
        <div className="bg-grid absolute inset-0" />
      </div>

      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => smoothScroll("home")} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center glow-purple">
              <Icon name="Layers" size={16} className="text-white" />
            </div>
            <span className="font-montserrat font-bold text-lg tracking-tight text-white">
              Browser<span className="text-gradient-primary"> Office</span>
            </span>
          </button>

          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => smoothScroll(item.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active === item.id ? "bg-purple-500/20 text-purple-300" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}>
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenu(!userMenu)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold">
                    {(user.name || user.email)[0].toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{user.name || user.email}</span>
                  {user.is_premium && <Icon name="Sparkles" size={12} className="text-yellow-400" />}
                </button>
                {userMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10">
                      <div className="text-xs text-white/50">Вы вошли как</div>
                      <div className="text-sm text-white truncate">{user.email}</div>
                      {user.is_premium && <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 text-xs font-semibold"><Icon name="Sparkles" size={10} /> Premium</div>}
                    </div>
                    {!user.is_premium && (
                      <button onClick={() => { setPremium(true); setUserMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-yellow-300 hover:bg-white/5 flex items-center gap-2">
                        <Icon name="Sparkles" size={14} /> Купить Premium
                      </button>
                    )}
                    <button onClick={() => { navigate("/pricing"); setUserMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 flex items-center gap-2">
                      <Icon name="Tag" size={14} /> Тарифы
                    </button>
                    <button onClick={() => { logout(); setUserMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 flex items-center gap-2 border-t border-white/5">
                      <Icon name="LogOut" size={14} /> Выйти
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setAuth(true)} className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Войти</button>
            )}
            <button onClick={() => user ? setPremium(true) : setAuth(true)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity animate-gradient">
              {user ? "Premium" : "Начать бесплатно"}
            </button>
          </div>

          <button className="md:hidden text-white/70" onClick={() => setMenuOpen(!menuOpen)}>
            <Icon name={menuOpen ? "X" : "Menu"} size={22} />
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-white/5 bg-background/95 backdrop-blur-xl px-6 py-4 flex flex-col gap-2">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => smoothScroll(item.id)}
                className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  active === item.id ? "bg-purple-500/20 text-purple-300" : "text-white/70 hover:text-white hover:bg-white/5"
                }`}>
                {item.label}
              </button>
            ))}
            {user ? (
              <>
                <button onClick={() => { setPremium(true); setMenuOpen(false); }} className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-sm font-bold">
                  {user.is_premium ? "✓ Premium активен" : "Оформить Premium"}
                </button>
                <button onClick={() => { logout(); setMenuOpen(false); }} className="w-full py-3 rounded-xl border border-white/10 text-white text-sm">Выйти</button>
              </>
            ) : (
              <button onClick={() => { setAuth(true); setMenuOpen(false); }} className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-sm font-semibold">
                Войти / Регистрация
              </button>
            )}
          </div>
        )}
      </nav>

      <main>
        {/* ── HERO ── */}
        <section id="home" className="min-h-screen flex items-center pt-16">
          <div className="max-w-6xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium mb-8 animate-slide-up">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                Более 500 готовых шаблонов
              </div>

              <h1 className="font-montserrat font-black text-5xl lg:text-6xl xl:text-7xl leading-[1.05] text-white mb-6 animate-slide-up-delay">
                Офисные<br /><span className="text-gradient-primary">инструменты</span><br />нового уровня
              </h1>

              <p className="text-white/60 text-lg leading-relaxed mb-10 animate-slide-up-delay-2">
                Готовые шаблоны документов, таблиц и презентаций.<br />
                Скачивай, настраивай и используй прямо сейчас.
              </p>

              <div className="flex flex-wrap gap-4 animate-slide-up-delay-2">
                <button onClick={() => smoothScroll("tools")}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold animate-gradient hover:opacity-90 transition-opacity glow-purple">
                  Начать работу
                </button>
                <button onClick={() => navigate("/pricing")} className="px-8 py-4 rounded-2xl border border-white/15 text-white font-semibold hover:bg-white/5 transition-all">
                  Тарифы и Premium
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-16 pt-8 border-t border-white/10">
                {[
                  ["500+", "Шаблонов"],
                  ["6", "Редакторов"],
                  ["24/7", "Доступно"],
                  ["0 ₽", "На старте"],
                ].map(([num, lbl]) => (
                  <div key={lbl}>
                    <div className="font-montserrat font-black text-2xl text-white">{num}</div>
                    <div className="text-white/40 text-xs mt-0.5">{lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hidden lg:flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 blur-2xl animate-pulse-glow" />
                <img
                  src="https://cdn.poehali.dev/projects/dcb0a39c-35e1-40cf-bb93-4ddb6041eda3/files/5a15d8e9-8a7e-408c-8a53-7a9a73ae3d19.jpg"
                  alt="Browser Office dashboard"
                  className="relative rounded-3xl border border-white/10 animate-float shadow-2xl w-full object-cover aspect-square"
                />
                <div className="absolute -top-4 -right-4 px-4 py-2 rounded-xl bg-purple-500/90 backdrop-blur text-white text-xs font-bold shadow-lg animate-float-delay glow-purple">
                  ✦ DOCX / XLSX / PPTX
                </div>
                <div className="absolute -bottom-4 -left-4 px-4 py-2 rounded-xl bg-cyan-500/90 backdrop-blur text-white text-xs font-bold shadow-lg animate-float glow-cyan">
                  ⚡ Скачать за 1 клик
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TOOLS ── */}
        <section id="tools" className="py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-medium mb-6">
                <Icon name="Sparkles" size={12} /> Инструменты
              </div>
              <h2 className="font-montserrat font-black text-4xl lg:text-5xl text-white mb-4">
                Всё для продуктивной<br /><span className="text-gradient-primary">работы с документами</span>
              </h2>
              <p className="text-white/50 text-lg max-w-xl mx-auto">Профессиональные шаблоны, которые экономят ваше время</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {TOOLS.map((tool) => {
                const c = colorMap[tool.color];
                return (
                  <div key={tool.id} onClick={() => handleToolClick(tool.id)}
                    className={`group relative p-6 rounded-2xl border bg-card card-glow cursor-pointer ${c.border}`}>
                    <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center mb-5`}>
                      <Icon name={tool.icon} size={22} className={c.text} fallback="File" />
                    </div>
                    <h3 className="font-montserrat font-bold text-lg text-white mb-2">{tool.label}</h3>
                    <p className="text-white/50 text-sm leading-relaxed mb-4">{tool.desc}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-xs font-semibold ${c.text}`}>{tool.count}</span>
                      <Icon name="ArrowRight" size={16} className={`${c.text} group-hover:translate-x-1 transition-transform`} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {tool.tags.map((tag) => (
                        <span key={tag} className={`px-2 py-0.5 rounded-md text-xs ${c.tag}`}>{tag}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── DOCS ── */}
        <section id="docs" className="py-28 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent pointer-events-none" />
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-300 text-xs font-medium mb-6">
                <Icon name="BookOpen" size={12} /> Документация
              </div>
              <h2 className="font-montserrat font-black text-4xl lg:text-5xl text-white mb-4">
                Всё, что нужно<br /><span className="text-gradient-warm">знать для старта</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5 mb-16">
              {DOC_ITEMS.map((item) => (
                <div key={item.title} onClick={() => navigate(`/docs/${item.slug}`)}
                  className="group flex items-start gap-5 p-6 rounded-2xl border border-white/8 bg-card hover:border-purple-500/40 hover:bg-purple-500/5 transition-all duration-300 cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-purple-500/20 transition-colors">
                    <Icon name={item.icon} size={18} className="text-purple-400" fallback="File" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-montserrat font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">{item.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-white/20 group-hover:text-purple-400 shrink-0 mt-0.5 transition-colors" />
                </div>
              ))}
            </div>

            <div className="relative p-10 rounded-3xl overflow-hidden border border-white/10">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-cyan-600/20" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
              <div className="relative text-center">
                <h3 className="font-montserrat font-black text-3xl text-white mb-3">Готов начать? Это бесплатно</h3>
                <p className="text-white/50 mb-8 max-w-lg mx-auto">
                  Получи доступ к базовым шаблонам без регистрации. ИИ-ассистент и расширенные функции — в Premium.
                </p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <button onClick={() => smoothScroll("tools")} className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold animate-gradient hover:opacity-90 transition-opacity glow-purple">
                    Попробовать бесплатно
                  </button>
                  <button onClick={() => navigate("/pricing")} className="px-8 py-4 rounded-2xl border border-white/15 text-white/80 font-semibold hover:bg-white/5 transition-all">
                    Посмотреть тарифы
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CONTACTS ── */}
        <section id="contacts" className="py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/30 bg-green-500/10 text-green-300 text-xs font-medium mb-6">
                <Icon name="Mail" size={12} /> Контакты
              </div>
              <h2 className="font-montserrat font-black text-4xl lg:text-5xl text-white mb-4">
                Есть вопросы?<br /><span className="text-gradient-primary">Напишите нам</span>
              </h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-10">
              <div className="p-8 rounded-3xl border border-white/8 bg-card">
                <h3 className="font-montserrat font-bold text-xl text-white mb-6">Отправить сообщение</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Ваше имя</label>
                    <input type="text" value={cName} onChange={e => setCName(e.target.value)} placeholder="Иван Петров"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/60 transition-colors text-sm" />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Email</label>
                    <input type="email" value={cEmail} onChange={e => setCEmail(e.target.value)} placeholder="ivan@company.ru"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/60 transition-colors text-sm" />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Сообщение</label>
                    <textarea rows={4} value={cMessage} onChange={e => setCMessage(e.target.value)} placeholder="Опишите ваш вопрос..."
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/60 transition-colors text-sm resize-none" />
                  </div>
                  {cStatus && (
                    <div className={`text-sm px-3 py-2 rounded-lg ${cStatus.ok ? "bg-green-500/10 text-green-300 border border-green-500/20" : "bg-red-500/10 text-red-300 border border-red-500/20"}`}>
                      {cStatus.msg}
                    </div>
                  )}
                  <button onClick={submitContact} disabled={cBusy}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold animate-gradient hover:opacity-90 transition-opacity disabled:opacity-50">
                    {cBusy ? "Отправляем..." : "Отправить"}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { icon: "Mail", title: "Email", value: "andreevvadim07071986@gmail.com", color: "purple", href: "mailto:andreevvadim07071986@gmail.com" },
                  { icon: "MessageCircle", title: "Telegram", value: "@browseroffice_support", color: "cyan", href: "https://t.me/browseroffice_support" },
                  { icon: "Phone", title: "Телефон", value: "+7 (991) 303-92-63", color: "green", href: "tel:+79913039263" },
                  { icon: "Clock", title: "Режим работы", value: "Круглосуточно, без выходных", color: "pink" },
                ].map((item) => {
                  const c = colorMap[item.color] ?? colorMap.purple;
                  const content = (
                    <>
                      <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
                        <Icon name={item.icon} size={18} className={c.text} fallback="Mail" />
                      </div>
                      <div>
                        <div className="text-white/40 text-xs mb-0.5">{item.title}</div>
                        <div className="text-white font-medium text-sm">{item.value}</div>
                      </div>
                    </>
                  );
                  return item.href ? (
                    <a key={item.title} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer"
                      className={`flex items-center gap-4 p-5 rounded-2xl border ${c.border} bg-card transition-all duration-300 hover:bg-white/5`}>
                      {content}
                    </a>
                  ) : (
                    <div key={item.title} className={`flex items-center gap-4 p-5 rounded-2xl border ${c.border} bg-card transition-all duration-300`}>
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-white/5 py-10">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <Icon name="Layers" size={12} className="text-white" />
              </div>
              <span>© 2026 Browser Office · Все инструменты бесплатно</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/40">
              <button onClick={() => navigate("/pricing")} className="hover:text-white">Тарифы</button>
              <button onClick={() => navigate("/docs/faq")} className="hover:text-white">FAQ</button>
              <button onClick={() => smoothScroll("contacts")} className="hover:text-white">Контакты</button>
            </div>
          </div>
        </footer>
      </main>

      <AuthModal open={auth} onClose={() => setAuth(false)} />
      <PremiumModal open={premium} onClose={() => setPremium(false)} onNeedAuth={() => setAuth(true)} />
      <AIAssistant />
    </div>
  );
};

export default Index;
