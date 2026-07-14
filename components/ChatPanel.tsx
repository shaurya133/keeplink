"use client";

import { useEffect, useRef, useState } from "react";
import { useChatPanel } from "@/components/ChatToggle";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatPanel() {
  const { isOpen, linkId, linkTitle, closeChat } = useChatPanel();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reset conversation when context changes
  useEffect(() => {
    setMessages([]);
    setInput("");
    setIsLoading(false);
    abortRef.current?.abort();
  }, [linkId]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setInput("");
    setIsLoading(true);

    const history = [...messages, userMsg].map(({ role, content }) => ({ role, content }));

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, linkId }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error("Chat request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m
          )
        );
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Sorry, something went wrong. Please try again." }
              : m
          )
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  const heading = linkTitle ?? "Ask about your links";
  const placeholder = linkTitle
    ? `Ask about "${linkTitle}"…`
    : "What have you saved about…";

  return (
    <>
      {isOpen && (
        <div
          className="chat-backdrop"
          onClick={closeChat}
          aria-hidden="true"
        />
      )}

      <div className={`chat-panel${isOpen ? " chat-panel--open" : ""}`} role="dialog" aria-label="AI chat">
        <div className="chat-panel__header">
          <span className="chat-panel__title">{heading}</span>
          <button
            type="button"
            onClick={closeChat}
            className="btn btn-ghost"
            aria-label="Close chat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="chat-panel__messages">
          {messages.length === 0 && (
            <p className="chat-panel__empty">
              {linkTitle
                ? "Ask me anything about this article."
                : "Ask me about your saved links — topics, recommendations, or anything else."}
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`chat-message chat-message--${m.role}`}
            >
              {m.content}
              {m.role === "assistant" && !m.content && isLoading && (
                <span className="chat-message--loading">
                  <span className="chat-loading-dot" />
                  <span className="chat-loading-dot" />
                  <span className="chat-loading-dot" />
                </span>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="chat-panel__footer">
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="btn btn-primary"
          >
            Send
          </button>
        </form>
      </div>
    </>
  );
}
