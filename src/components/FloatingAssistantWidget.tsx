"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const STARTER_PROMPTS = [
  "What is the practice support phone number?",
  "Cual es el telefono de soporte de la clinica?",
  "Show my next appointment",
  "Muestrame mi proxima cita",
  "Schedule on 2026-06-01 at 3:00 PM for physical therapy",
  "Agenda una cita el 2026-06-01 a las 3:00 PM para terapia fisica",
];

function detectLang(input: string) {
  const text = input.toLowerCase();
  if (/[\u00c0-\u017f]/.test(text)) return "es" as const;
  if (/(hola|buenos|buenas|gracias|cita|agendar|reagendar|cancelar|portal|ayuda|clinica|correo|telefono)/.test(text)) return "es" as const;
  return "en" as const;
}

function t(lang: "es" | "en", en: string, es: string) {
  return lang === "es" ? es : en;
}

export default function FloatingAssistantWidget() {
  const pathname = usePathname();
  const uiLang = useMemo<"es" | "en">(() => {
    if (typeof navigator === "undefined") return "en";
    return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
  }, []);
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [readAloud, setReadAloud] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: t(
        uiLang,
        "Hi. I am your ApexCare assistant. You can chat with me in English or Spanish. I can also read replies out loud.",
        "Hola. Soy tu asistente ApexCare. Puedes conversar conmigo en espanol o ingles. Tambien puedo leer respuestas en voz alta.",
      ),
    },
  ]);

  const isPortalPath = pathname?.startsWith("/portal") ?? false;
  const endpoint = useMemo(() => (isPortalPath ? "/api/portal/assistant" : "/api/assistant"), [isPortalPath]);

  useEffect(() => {
    if (!readAloud || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant) return;

    const utterance = new SpeechSynthesisUtterance(lastAssistant.text);
    utterance.lang = detectLang(lastAssistant.text) === "es" ? "es-US" : "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [messages, readAloud]);

  async function sendMessage(raw: string) {
    const text = raw.trim();
    if (!text || sending) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        role: "user",
        text,
      },
    ]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json().catch(() => ({}));
      const replyText =
        typeof data.reply === "string"
          ? data.reply
          : res.status === 401
            ? t(uiLang, "Please sign in to the patient portal to manage appointments.", "Inicia sesion en el portal de pacientes para gestionar citas.")
            : t(uiLang, "Assistant is temporarily unavailable. Please try again.", "El asistente no esta disponible temporalmente. Intenta de nuevo.");

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: replyText,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: t(uiLang, "Assistant is temporarily unavailable. Please try again.", "El asistente no esta disponible temporalmente. Intenta de nuevo."),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[60]">
      {open && (
        <section className="mb-3 w-[calc(100vw-2rem)] sm:w-[360px] max-h-[70vh] rounded-xl bg-white shadow-xl ring-1 ring-slate-200 flex flex-col overflow-hidden">
          <header className="px-3 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">AI Assistant</h2>
              <p className="text-[11px] text-slate-500">
                {t(uiLang, "Quick help anywhere in ApexCare", "Ayuda rapida en cualquier parte de ApexCare")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-500 hover:text-slate-700 text-sm font-medium"
              aria-label="Close assistant"
            >
              {t(uiLang, "Close", "Cerrar")}
            </button>
          </header>

          <div className="px-2.5 pt-2 flex flex-wrap gap-1.5">
            <button type="button" className="chip bg-white text-slate-700 ring-slate-200" onClick={() => setLargeText((v) => !v)}>
              {largeText ? t(uiLang, "Normal text", "Texto normal") : t(uiLang, "Large text", "Texto grande")}
            </button>
            <button type="button" className="chip bg-white text-slate-700 ring-slate-200" onClick={() => setReadAloud((v) => !v)}>
              {readAloud ? t(uiLang, "Voice on", "Voz activada") : t(uiLang, "Voice off", "Voz desactivada")}
            </button>
          </div>

          <div
            className={`p-2.5 bg-slate-50 h-[250px] overflow-y-auto space-y-2 ${largeText ? "text-sm" : "text-xs"}`}
            aria-live="polite"
            aria-label={t(uiLang, "Assistant conversation", "Conversacion del asistente")}
          >
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[92%] whitespace-pre-wrap rounded-md px-2.5 py-2 ${largeText ? "text-sm" : "text-xs"} ${
                    m.role === "user" ? "bg-brand-600 text-white" : "bg-white text-slate-800 ring-1 ring-slate-200"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {sending && <div className="text-[11px] text-slate-500">Assistant is thinking...</div>}
          </div>

          <div className="px-2.5 pt-2 flex flex-wrap gap-1.5">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                disabled={sending}
                className="chip bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 text-[10px]"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="p-2.5 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t(uiLang, "Ask anything...", "Pregunta lo que necesites...")}
              className="input flex-1 text-xs"
              disabled={sending}
            />
            <button type="submit" className="btn-primary px-3 py-1.5 text-xs" disabled={sending || !input.trim()}>
                {t(uiLang, "Send", "Enviar")}
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="h-12 w-12 rounded-full shadow-lg text-white flex items-center justify-center bg-[linear-gradient(135deg,var(--teal-600),var(--teal-700))] hover:brightness-110 transition"
        aria-label={open ? t(uiLang, "Close assistant", "Cerrar asistente") : t(uiLang, "Open assistant", "Abrir asistente")}
      >
        {open ? "X" : "AI"}
      </button>
    </div>
  );
}
