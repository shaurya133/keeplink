"use client";

import { createContext, useContext, useState } from "react";

interface ChatPanelContext {
  isOpen: boolean;
  linkId: string | null;
  linkTitle: string | null;
  openChat: (linkId?: string, linkTitle?: string) => void;
  closeChat: () => void;
}

const ChatContext = createContext<ChatPanelContext | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [linkId, setLinkId] = useState<string | null>(null);
  const [linkTitle, setLinkTitle] = useState<string | null>(null);

  function openChat(id?: string, title?: string) {
    setLinkId(id ?? null);
    setLinkTitle(title ?? null);
    setIsOpen(true);
  }

  function closeChat() {
    setIsOpen(false);
  }

  return (
    <ChatContext.Provider value={{ isOpen, linkId, linkTitle, openChat, closeChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatPanel() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatPanel must be used within ChatProvider");
  return ctx;
}
