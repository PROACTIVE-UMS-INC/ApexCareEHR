"use client";

import { useState } from "react";

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const STARTER_PROMPTS = [
  "Show my next appointment",
  "Schedule on 2026-06-01 at 3:00 PM for physical therapy",
  "Reschedule my appointment to 2026-06-03 at 10:30 AM",
  "Cancel my appointment",
  "What is the practice support phone number?",
];

export default function PortalAssistantChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text:
        "Hello. I am your ApexCare portal assistant. I can answer practice questions and help schedule, reschedule, or cancel appointments.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

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
            ? "Done."
            : "Assistant is temporarily unavailable. Please try again.";

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
          text: "Assistant is temporarily unavailable. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="card card-pad space-y-3">
      <header>
        <h2 className="text-base sm:text-lg font-semibold text-slate-900">AI Assistant</h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Ask about practice information or appointment tasks in plain language.
        </p>
      </header>

      <div className="rounded-md ring-1 ring-slate-200 bg-slate-50 p-3 h-[420px] overflow-y-auto space-y-2">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] whitespace-pre-wrap rounded-md px-3 py-2 text-sm ${
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
          placeholder="Type your question or request..."
          className="input flex-1"
          disabled={sending}
        />
        <button type="submit" className="btn-primary" disabled={sending || !input.trim()}>
          Send
        </button>
      </form>
    </section>
  );
}
