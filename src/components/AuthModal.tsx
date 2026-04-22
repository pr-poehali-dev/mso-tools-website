import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Icon from "@/components/ui/icon";

type Props = { open: boolean; onClose: () => void };

const AuthModal = ({ open, onClose }: Props) => {
  const { sendCode, verifyCode, oauthLogin } = useAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  if (!open) return null;

  const reset = () => { setStep("email"); setCode(""); setError(""); setInfo(""); };
  const close = () => { reset(); onClose(); };

  const handleSend = async () => {
    setError(""); setInfo("");
    if (!email.includes("@")) { setError("Введите корректный email"); return; }
    setBusy(true);
    const r = await sendCode(email);
    setBusy(false);
    if (r.error) { setError(r.error); return; }
    setInfo(`Код отправлен на ${email}`);
    setStep("code");
  };

  const handleVerify = async () => {
    setError("");
    if (code.length < 4) { setError("Введите код из письма"); return; }
    setBusy(true);
    const r = await verifyCode(email, code, name);
    setBusy(false);
    if (r.error) { setError(r.error); return; }
    close();
  };

  const handleOAuth = async (provider: "google" | "apple" | "yandex") => {
    setError("");
    const providerNames = { google: "Google", apple: "Apple", yandex: "Яндекс" };
    const mockEmail = prompt(`Введите ваш email от ${providerNames[provider]}:`);
    if (!mockEmail || !mockEmail.includes("@")) return;
    const mockName = prompt("Ваше имя:") || mockEmail.split("@")[0];
    setBusy(true);
    const r = await oauthLogin(provider, mockEmail, mockName);
    setBusy(false);
    if (r.error) { setError(r.error); return; }
    close();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={close}>
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-2xl text-white">Вход в Browser Office</h2>
          <button onClick={close} className="text-white/40 hover:text-white"><Icon name="X" size={20} /></button>
        </div>

        {step === "email" && (
          <>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/60">Имя (для регистрации)</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Иван"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="text-xs text-white/60">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@mail.ru"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500" />
              </div>
              {error && <div className="text-red-400 text-sm">{error}</div>}
              {info && <div className="text-green-400 text-sm">{info}</div>}
              <button onClick={handleSend} disabled={busy}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold disabled:opacity-50">
                {busy ? "Отправляем..." : "Получить код на email"}
              </button>
            </div>

            <div className="my-5 flex items-center gap-3 text-xs text-white/30">
              <div className="flex-1 h-px bg-white/10" /> или <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="space-y-2">
              <button onClick={() => handleOAuth("google")} disabled={busy}
                className="w-full py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm flex items-center justify-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white text-[#4285f4] flex items-center justify-center font-bold text-sm">G</span>
                Войти через Google
              </button>
              <button onClick={() => handleOAuth("apple")} disabled={busy}
                className="w-full py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm flex items-center justify-center gap-2">
                <Icon name="Apple" size={16} fallback="Smartphone" /> Войти через Apple
              </button>
              <button onClick={() => handleOAuth("yandex")} disabled={busy}
                className="w-full py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm flex items-center justify-center gap-2">
                <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xs">Я</span>
                Войти через Яндекс ID
              </button>
            </div>
          </>
        )}

        {step === "code" && (
          <div className="space-y-3">
            <p className="text-white/60 text-sm">Код отправлен на <b className="text-white">{email}</b>. Проверьте почту (включая спам).</p>
            <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000" maxLength={6}
              className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-2xl tracking-[0.5em] text-center font-mono focus:outline-none focus:border-purple-500" />
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <button onClick={handleVerify} disabled={busy}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold disabled:opacity-50">
              {busy ? "Проверяем..." : "Войти"}
            </button>
            <button onClick={() => setStep("email")} className="w-full text-sm text-white/50 hover:text-white">← Изменить email</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
