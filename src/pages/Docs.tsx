import { useParams, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const DOCS: Record<string, { title: string; icon: string; sections: { h: string; p: string }[] }> = {
  start: {
    title: "Быстрый старт",
    icon: "BookOpen",
    sections: [
      { h: "1. Выберите инструмент", p: "На главной странице нажмите на карточку нужного раздела: Документы, Таблицы, Презентации, Формы, Дашборды или Планировщик." },
      { h: "2. Выберите шаблон", p: "В открывшемся редакторе нажмите кнопку «Шаблоны» — вы увидите галерею готовых решений. Один клик — и шаблон загружен." },
      { h: "3. Отредактируйте", p: "Все поля редактируются напрямую: кликайте и меняйте текст, цифры, цвета. Изменения сохраняются автоматически." },
      { h: "4. Экспортируйте", p: "Скачайте готовый файл в DOCX, XLSX, PPTX, CSV, HTML, PDF или JSON одним кликом по кнопке экспорта." },
    ],
  },
  templates: {
    title: "Настройка шаблонов",
    icon: "Settings",
    sections: [
      { h: "Редактирование содержимого", p: "В каждом редакторе все элементы кликабельны. Кликните по заголовку, абзацу, ячейке или полю формы — и сразу меняйте текст." },
      { h: "Темы и стили", p: "В презентациях доступны готовые темы. В таблицах можно менять формулы. В дашбордах — цвета метрик и названия категорий." },
      { h: "Сохранение собственных шаблонов", p: "Отредактируйте документ под свои нужды и сохраните — в следующий раз он загрузится автоматически. Для облачного хранения нужна Premium-подписка." },
      { h: "Совместная работа", p: "Premium-пользователи могут делиться ссылкой на документ и работать вместе в реальном времени." },
    ],
  },
  formats: {
    title: "Форматы файлов",
    icon: "Download",
    sections: [
      { h: "DOCX — для Microsoft Word", p: "Стандартный формат. Открывается в Word, LibreOffice, Google Docs, Pages и любом онлайн-редакторе." },
      { h: "XLSX / CSV — для таблиц", p: "XLSX работает в Excel и Google Sheets. CSV — универсальный формат, подходит для импорта в 1С, CRM, базы данных." },
      { h: "PPTX / HTML — для презентаций", p: "PPTX открывается в PowerPoint и Keynote. HTML можно показывать прямо в браузере без установки программ." },
      { h: "PDF — для печати", p: "Используйте кнопку «Печать» и выберите «Сохранить как PDF» — идеально для отправки клиентам и архива." },
    ],
  },
  faq: {
    title: "FAQ",
    icon: "HelpCircle",
    sections: [
      { h: "Сколько стоит использование?", p: "Базовые функции — бесплатно навсегда. Premium с ИИ-ассистентом: 199 ₽/мес или 400 ₽/год." },
      { h: "Нужна ли регистрация?", p: "Нет, все базовые инструменты работают без регистрации. Регистрация нужна только для Premium и синхронизации между устройствами." },
      { h: "Безопасны ли мои данные?", p: "Все документы хранятся только в вашем браузере (localStorage). Мы не видим содержимое. Для облачной синхронизации нужна Premium-подписка." },
      { h: "Работает ли офлайн?", p: "Да, после первой загрузки все редакторы работают без интернета. Экспорт, сохранение и шаблоны доступны офлайн." },
      { h: "Как отменить подписку?", p: "Напишите на andreevvadim07071986@gmail.com — возврат средств в течение 7 дней без вопросов." },
    ],
  },
};

const Docs = () => {
  const { section } = useParams();
  const navigate = useNavigate();
  const doc = DOCS[section || "start"] || DOCS.start;

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="bg-slate-900/80 backdrop-blur border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5">
            <Icon name="ArrowLeft" size={16} /> На главную
          </button>
          <div className="w-px h-6 bg-white/10" />
          <span className="text-sm text-white/60">Документация</span>
          <span className="text-white/30">/</span>
          <span className="text-sm text-white">{doc.title}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 grid md:grid-cols-[240px_1fr] gap-10">
        <aside className="space-y-1">
          {Object.entries(DOCS).map(([k, d]) => (
            <button key={k} onClick={() => navigate(`/docs/${k}`)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-left transition-colors ${(section || "start") === k ? "bg-purple-500/20 text-purple-300" : "text-white/60 hover:bg-white/5"}`}>
              <Icon name={d.icon} size={16} fallback="File" /> {d.title}
            </button>
          ))}
        </aside>

        <main>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs mb-4">
            <Icon name={doc.icon} size={12} fallback="File" /> Документация
          </div>
          <h1 className="font-montserrat font-black text-4xl mb-8">{doc.title}</h1>
          <div className="space-y-6">
            {doc.sections.map(s => (
              <div key={s.h} className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <h2 className="font-bold text-xl mb-3 text-purple-300">{s.h}</h2>
                <p className="text-white/70 leading-relaxed">{s.p}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Docs;
