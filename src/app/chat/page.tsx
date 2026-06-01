"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "model";
  content: string;
}

const SUGGESTIONS = [
  "Bagaimana kondisi keuanganku bulan ini?",
  "Di mana aku paling banyak menghabiskan uang?",
  "Berikan tips cara hemat pengeluaran",
  "Apakah tingkat tabunganku sudah baik?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages }),
      });

      const data = await res.json();
      setMessages([...newMessages, { role: "model", content: data.reply }]);
    } catch {
      setMessages([
        ...newMessages,
        { role: "model", content: "Maaf, terjadi kesalahan. Silakan coba lagi." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
      <div className="glass mb-3 flex items-center gap-3 rounded-3xl px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0a84ff] to-[#bf5af2]">
          <Sparkles className="text-white" size={20} />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-ink">FinSight AI</h1>
          <p className="text-xs text-ink/45">Hanya menjawab seputar keuangan pribadi Anda</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-2 py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#0a84ff] to-[#bf5af2] shadow-[0_10px_30px_rgba(10,132,255,0.4)]">
              <Bot className="text-white" size={32} />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-ink">Halo, saya FinSight AI</h2>
            <p className="mb-6 max-w-sm text-sm text-ink/50">
              Tanyakan apa saja tentang keuanganmu. Saya akan menganalisis data transaksimu dan memberikan saran personal.
            </p>
            <div className="grid w-full max-w-lg grid-cols-2 gap-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="glass glass-hover rounded-2xl px-4 py-3 text-left text-sm text-ink/80"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl ${msg.role === "user" ? "bg-ink/10" : "bg-gradient-to-br from-[#0a84ff] to-[#bf5af2]"}`}>
              {msg.role === "user" ? (
                <User size={16} className="text-ink/80" />
              ) : (
                <Bot size={16} className="text-white" />
              )}
            </div>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] ${
                msg.role === "user"
                  ? "bg-[#0a84ff] text-white shadow-[0_6px_20px_rgba(10,132,255,0.4)]"
                  : "glass text-ink/90"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0a84ff] to-[#bf5af2]">
              <Bot size={16} className="text-white" />
            </div>
            <div className="glass rounded-3xl px-4 py-3">
              <div className="flex h-5 items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 animate-bounce rounded-full bg-ink/50"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="glass mt-3 flex gap-2 rounded-3xl p-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanyakan sesuatu tentang keuanganmu..."
          disabled={loading}
          className="flex-1 bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0a84ff] text-white shadow-[0_6px_20px_rgba(10,132,255,0.4)] transition-transform hover:bg-[#3a9bff] active:scale-95 disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
