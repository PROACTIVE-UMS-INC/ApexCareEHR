"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const STARTER_PROMPTS = [
  "What is the practice support phone number?",
  "Show my next appointment",
  "Schedule on 2026-06-01 at 3:00 PM for physical therapy",
];

export default function FloatingAssistantWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi. I am your ApexCare assistant. I can answer practice questions here, and help with appointment tasks in the portal.",
    },
  ]);

  const isPortalPath = pathname?.startsWith("/portal") ?? false;
  const endpoint = useMemo(() => (isPortalPath ? "/api/portal/assistant" : "/api/assistant"), [isPortalPath]);

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
            ? "Please sign in to the patient portal to manage appointments."
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
    <div className="fixed bottom-4 right-4 z-[60]">
      {open && (
        <section className="mb-3 w-[calc(100vw-2rem)] sm:w-[360px] max-h-[70vh] rounded-xl bg-white shadow-xl ring-1 ring-slate-200 flex flex-col overflow-hidden">
          <header className="px-3 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">AI Assistant</h2>
              <p className="text-[11px] text-slate-500">Quick help anywhere in ApexCare</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-500 hover:text-slate-700 text-sm font-medium"
              aria-label="Close assistant"
            >
              Close
            </button>
          </header>

          <div className="p-2.5 bg-slate-50 h-[250px] overflow-y-auto space-y-2">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[92%] whitespace-pre-wrap rounded-md px-2.5 py-2 text-xs ${
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
              placeholder="Ask anything..."
              className="input flex-1 text-xs"
              disabled={sending}
            />
            <button type="submit" className="btn-primary px-3 py-1.5 text-xs" disabled={sending || !input.trim()}>
              Send
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="h-12 w-12 rounded-full shadow-lg text-white flex items-center justify-center bg-[linear-gradient(135deg,var(--teal-600),var(--teal-700))] hover:brightness-110 transition"
        aria-label={open ? "Close assistant" : "Open assistant"}
      >
        {open ? "X" : "AI"}
      </button>
    </div>
  );
}
