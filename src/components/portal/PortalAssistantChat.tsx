"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

const STARTER_PROMPTS = [
  "Show my next appointment",
  "Muestrame mi proxima cita",
  "Schedule on 2026-06-01 at 3:00 PM for physical therapy",
  "Agenda una cita el 2026-06-01 a las 3:00 PM para terapia fisica",
  "Reschedule my appointment to 2026-06-03 at 10:30 AM",
  "Reagenda mi cita para 2026-06-03 a las 10:30 AM",
  "Cancel my appointment",
  "Cancela mi cita",
  "What is the practice support phone number?",
  "Cual es el telefono de soporte de la clinica?",
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

export default function PortalAssistantChat() {
  const uiLang = useMemo<"es" | "en">(() => {
    if (typeof navigator === "undefined") return "en";
    return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
  }, []);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: t(
        uiLang,
        "Hello. I am your ApexCare portal assistant. You can talk to me in English or Spanish, and I can help with appointments and practice questions.",
        "Hola. Soy tu asistente del portal ApexCare. Puedes hablar conmigo en espanol o ingles, y te ayudo con citas y preguntas de la clinica.",
      ),
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [readAloud, setReadAloud] = useState(true);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<null | { stop: () => void }>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    setSpeechSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

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

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/portal/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json().catch(() => ({}));
      const replyText =
        typeof data.reply === "string"
          ? data.reply
          : res.ok
            ? t(uiLang, "Done.", "Listo.")
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

  function toggleDictation() {
    if (!speechSupported || typeof window === "undefined") return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const w = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const RecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!RecognitionCtor) return;

    const recognition = new RecognitionCtor();
    recognition.lang = uiLang === "es" ? "es-US" : "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0]?.transcript || "")
        .join(" ")
        .trim();
      setInput(transcript);
    };
    recognition.onerror = () => {
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  return (
    <section className="card card-pad space-y-3">
      <header>
        <h2 className="text-base sm:text-lg font-semibold text-slate-900">AI Assistant</h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          {t(
            uiLang,
            "Ask about practice information or appointment tasks in plain language. English and Spanish are supported.",
            "Pregunta sobre informacion de la clinica o tareas de citas en lenguaje natural. Se admite espanol e ingles.",
          )}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="chip bg-white text-slate-700 ring-slate-200" onClick={() => setLargeText((v) => !v)}>
            {largeText ? t(uiLang, "Normal text", "Texto normal") : t(uiLang, "Large text", "Texto grande")}
          </button>
          <button type="button" className="chip bg-white text-slate-700 ring-slate-200" onClick={() => setReadAloud((v) => !v)}>
            {readAloud ? t(uiLang, "Voice on", "Voz activada") : t(uiLang, "Voice off", "Voz desactivada")}
          </button>
        </div>
      </header>

      <div
        className={`rounded-md ring-1 ring-slate-200 bg-slate-50 p-3 h-[420px] overflow-y-auto space-y-2 ${largeText ? "text-base" : "text-sm"}`}
        aria-live="polite"
        aria-label={t(uiLang, "Assistant conversation", "Conversacion del asistente")}
      >
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] whitespace-pre-wrap rounded-md px-3 py-2 ${largeText ? "text-base" : "text-sm"} ${
                m.role === "user"
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-800 ring-1 ring-slate-200"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {sending && <div className="text-xs text-slate-500">Assistant is thinking...</div>}
      </div>

      <div className="flex flex-wrap gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => sendMessage(prompt)}
            disabled={sending}
            className="chip bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t(uiLang, "Type your question or request...", "Escribe tu pregunta o solicitud...")}
          aria-label={t(uiLang, "Assistant message", "Mensaje para el asistente")}
          className="input flex-1"
          disabled={sending}
        />
        <button
          type="button"
          onClick={toggleDictation}
          disabled={!speechSupported || sending}
          className="btn-secondary"
          aria-label={
            listening
              ? t(uiLang, "Stop dictation", "Detener dictado")
              : t(uiLang, "Start dictation", "Iniciar dictado")
          }
        >
          {listening ? t(uiLang, "Listening...", "Escuchando...") : t(uiLang, "Mic", "Micro")}
        </button>
        <button type="submit" className="btn-primary" disabled={sending || !input.trim()}>
          {t(uiLang, "Send", "Enviar")}
        </button>
      </form>
      {!speechSupported && (
        <p className="text-xs text-slate-500">
          {t(
            uiLang,
            "Voice dictation is not supported in this browser.",
            "El dictado por voz no es compatible con este navegador.",
          )}
        </p>
      )}
    </section>
  );
}
