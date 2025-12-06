'use client';

import Link from 'next/link';
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  Bot,
  History,
  Loader2,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { ChatMessage, ChatSessionSummary } from '@/types';

type LocalMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

const suggestedPrompts = [
  'How do I file a trademark for my business name?',
  'Draft a client-friendly summary of a lease agreement.',
  'List key clauses I should add to an NDA.',
  'Explain the process to register a startup in Delaware.',
];

const quickTips = [
  'What documents do I need to form an LLC?',
  'How long does it take to finalize a divorce?',
  'Can I trademark my app logo internationally?',
];

const generateTempId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const formatTimestamp = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatRelativeTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const mapHistoryToLocal = (history: ChatMessage[]): LocalMessage[] =>
  history.map((message) => ({
    id: message._id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
  }));

export function ChatWidget() {
  const { isAuthenticated, user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const loadSessions = useCallback(
    async (withSpinner = true) => {
      if (!isAuthenticated) {
        return;
      }
      if (withSpinner) {
        setSessionsLoading(true);
      }
      try {
        const data = await api.getChatSessions();
        setSessions(data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Unable to load chats');
      } finally {
        if (withSpinner) {
          setSessionsLoading(false);
        }
      }
    },
    [isAuthenticated],
  );

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadSessions();
    }
  }, [isOpen, isAuthenticated, loadSessions]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSessions([]);
      setMessages([]);
      setActiveSessionId(null);
    }
  }, [isAuthenticated]);

  const handleSelectSession = useCallback(
    async (sessionId: string) => {
      if (historyLoading) return;
      if (sessionId === activeSessionId && messages.length) {
        return;
      }
      const previousId = activeSessionId;
      setActiveSessionId(sessionId);
      setHistoryLoading(true);
      setMessages([]);
      try {
        const history = await api.getChatHistory(sessionId);
        setMessages(mapHistoryToLocal(history));
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || 'Unable to load conversation',
        );
        setActiveSessionId(previousId);
      } finally {
        setHistoryLoading(false);
      }
    },
    [activeSessionId, historyLoading, messages.length],
  );

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setInput('');
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await api.deleteChatSession(sessionId);
      setSessions((prev) =>
        prev.filter((session) => session.sessionId !== sessionId),
      );
      if (activeSessionId === sessionId) {
        handleNewChat();
      }
      toast.success('Conversation deleted');
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to delete conversation',
      );
    }
  };

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || isSending) {
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please login to chat with the assistant');
      return;
    }

    const question = input.trim();
    const tempId = generateTempId();
    const timestamp = new Date().toISOString();

    setMessages((prev) => [
      ...prev,
      { id: tempId, role: 'user', content: question, createdAt: timestamp },
    ]);
    setInput('');
    setIsSending(true);

    try {
      const response = await api.askQuestion(
        question,
        activeSessionId || undefined,
      );
      const assistantMessage: LocalMessage = {
        id: generateTempId(),
        role: 'assistant',
        content: response.answer,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setActiveSessionId(response.sessionId);
      loadSessions(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to get response');
      setMessages((prev) => prev.filter((message) => message.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const currentSessionTitle = useMemo(() => {
    if (!activeSessionId) {
      return 'New conversation';
    }
    return (
      sessions.find((session) => session.sessionId === activeSessionId)
        ?.title || 'Conversation'
    );
  }, [activeSessionId, sessions]);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      setIsOpen(false);
    }
  };

  const showAuthWall = !isAuthenticated;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] p-4 text-[#1b1205] shadow-2xl shadow-[#d5b47f]/30 transition hover:scale-105"
          aria-label="Open Lawvera Copilot"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 backdrop-blur-sm sm:items-center"
          onClick={handleOverlayClick}
        >
          <div className="relative flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[var(--surface)] shadow-2xl shadow-[#d5b47f]/25 sm:h-[80vh] sm:flex-row">
            <aside className="w-full border-b border-white/5 bg-[var(--surface-muted)] p-5 sm:w-72 sm:border-b-0 sm:border-r sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Lawvera Copilot
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                    {user?.name ?? 'Guest'}
                  </p>
                </div>
            <button
              onClick={() => setIsOpen(false)}
                  className="rounded-full border border-white/10 p-2 text-[var(--text-muted)] transition hover:border-white/30 hover:text-white"
                  aria-label="Close chat"
            >
                  <X className="h-4 w-4" />
            </button>
          </div>

              {isAuthenticated ? (
                <>
                  <button
                    onClick={handleNewChat}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-[var(--text-primary)] shadow-sm transition hover:border-[#d5b47f]/40"
                  >
                    <Plus className="h-4 w-4" />
                    New chat
                  </button>

                  <div className="mt-6">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                      <History className="h-3.5 w-3.5" />
                      Recent chats
                    </div>
                    <div className="mt-4 space-y-3 overflow-y-auto pr-1">
                      {sessionsLoading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                          <div
                            key={`session-skeleton-${index}`}
                            className="animate-pulse rounded-2xl border border-white/5 bg-white/[0.04] p-4"
                          >
                            <div className="h-4 w-2/3 rounded bg-white/10" />
                            <div className="mt-3 h-3 w-full rounded bg-white/5" />
                          </div>
                        ))
                      ) : sessions.length ? (
                        sessions.map((session) => (
                          <div
                            key={session.sessionId}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleSelectSession(session.sessionId)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                handleSelectSession(session.sessionId);
                              }
                            }}
                            className={`group relative rounded-2xl border p-4 transition ${
                              activeSessionId === session.sessionId
                                ? 'border-[var(--brand-primary)] bg-[var(--brand-accent-soft)]'
                                : 'border-white/5 hover:border-white/20 hover:bg-white'
                            }`}
                          >
                            <p className="pr-6 text-sm font-medium text-[var(--text-primary)]">
                              {session.title}
                            </p>
                            <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">
                              {session.lastMessagePreview ||
                                'Tap to continue your conversation'}
                            </p>
                            <span className="mt-2 block text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                              {formatRelativeTime(session.updatedAt)}
                            </span>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteSession(session.sessionId);
                              }}
                              className="absolute right-3 top-3 hidden rounded-full border border-white/10 p-1 text-[var(--text-muted)] hover:border-white/40 hover:text-[#b07a43] group-hover:flex"
                              aria-label="Delete conversation"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-[var(--text-muted)]">
                          Start your first conversation to see it here.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white p-5 text-[var(--text-primary)] shadow-sm">
                  <p className="text-base font-semibold">Sign in to sync chats</p>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    Create an account to access your AI assistant and saved
                    history across devices.
                  </p>
                  <Link
                    href="/auth/login"
                    className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] px-4 py-2 text-sm font-semibold text-[#1b1205] transition hover:opacity-90"
                  >
                    Go to login
                  </Link>
                </div>
              )}
            </aside>

            <section className="flex flex-1 flex-col bg-[var(--surface)]">
              <header className="flex items-center justify-between border-b border-white/5 px-6 py-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
                    Lawvera Copilot
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                    {currentSessionTitle}
                  </h3>
                </div>
                {isSending && (
                  <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating response...
                  </div>
                )}
              </header>

              <div className="relative flex-1 overflow-y-auto px-6 py-6">
                {showAuthWall ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="rounded-full border border-white/10 bg-white/[0.04] p-4 text-[var(--brand-primary)]">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h4 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
                      Sign in to chat with Lawvera Copilot
                    </h4>
                    <p className="mt-2 max-w-md text-sm text-[var(--text-muted)]">
                      Login or create an account to unlock instant legal guidance from
                      our AI assistant tailored to your needs.
                    </p>
                    <Link
                      href="/auth/login"
                      className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] px-6 py-3 text-sm font-semibold text-[#1b1205] transition hover:opacity-90"
                    >
                      Go to login
                    </Link>
                  </div>
                ) : (
                  <>
                    {!messages.length && !historyLoading && (
                      <div className="mx-auto max-w-2xl text-center">
                    <div className="inline-flex rounded-full border border-white/10 bg-white p-3 text-[var(--brand-primary)] shadow-sm">
                          <Sparkles className="h-6 w-6" />
                        </div>
                        <h4 className="mt-4 text-2xl font-semibold text-[var(--text-primary)]">
                          Welcome to your legal co-pilot
                        </h4>
                        <p className="mt-2 text-sm text-[var(--text-muted)]">
                          Ask questions about legal processes, documents, or
                          best practices and get instant, friendly guidance.
                        </p>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                          {suggestedPrompts.map((prompt) => (
                            <button
                              key={prompt}
                              type="button"
                              onClick={() => setInput(prompt)}
                              className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-left text-sm text-[var(--text-primary)] transition hover:border-[#d5b47f]/40"
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {historyLoading && (
                        <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div key={`history-skeleton-${index}`} className="space-y-3">
                            <div className="h-4 w-24 rounded bg-white/40" />
                            <div className="h-20 rounded-2xl bg-white/60" />
                          </div>
                        ))}
              </div>
            )}

                    <div className="space-y-6">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.role === 'user'
                              ? 'flex-row-reverse text-right'
                              : 'text-left'
                }`}
              >
                <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] ${
                              message.role === 'user'
                                ? 'text-[#1b1205] bg-gradient-to-br from-[#f3e2c1] to-[#d5b47f]'
                                : 'text-[var(--brand-primary)]'
                            }`}
                          >
                            {message.role === 'user' ? (
                              <UserIcon className="h-4 w-4" />
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                          </div>
                          <div
                            className={`max-w-3xl rounded-3xl border px-4 py-3 text-sm leading-relaxed shadow-lg shadow-black/20 ${
                    message.role === 'user'
                                ? 'border-transparent bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205]'
                                : 'border-white/5 bg-white/[0.04] text-[var(--text-primary)]'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            <span className="mt-2 block text-xs text-[var(--text-muted)]">
                              {formatTimestamp(message.createdAt)}
                            </span>
                </div>
              </div>
            ))}

                      {isSending && (
                        <div className="flex gap-3 text-left">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white text-[var(--brand-primary)]">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div className="max-w-3xl rounded-3xl border border-white/5 bg-white px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="h-2 w-2 animate-bounce rounded-full bg-white/70" />
                              <span
                                className="h-2 w-2 animate-bounce rounded-full bg-white/70"
                                style={{ animationDelay: '0.15s' }}
                              />
                              <span
                                className="h-2 w-2 animate-bounce rounded-full bg-white/70"
                                style={{ animationDelay: '0.3s' }}
                              />
                  </div>
                </div>
              </div>
            )}
                    </div>

            <div ref={messagesEndRef} />
                    <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
                      Lawvera Copilot provides general guidance. Always consult a
                      licensed attorney for formal legal advice.
                    </p>
                  </>
                )}
          </div>

              {!showAuthWall && (
                <form
                  ref={formRef}
                  onSubmit={handleSend}
                  className="border-t border-white/5 bg-[var(--surface)] p-4 sm:p-6"
                >
                  <div className="rounded-3xl border border-white/10 bg-[var(--surface-muted)] p-4 shadow-2xl shadow-[#d5b47f]/20">
                    <textarea
                value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          if (!isSending && input.trim()) {
                            formRef.current?.requestSubmit();
                          }
                        }
                      }}
                      placeholder="Ask anything about legal workflows, documents, or processes..."
                      rows={3}
                      className="w-full resize-none rounded-2xl border border-white/5 bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:outline-none"
                      disabled={isSending}
                    />
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="flex flex-wrap gap-2">
                        {quickTips.map((tip) => (
                          <button
                            key={tip}
                            type="button"
                            onClick={() => setInput(tip)}
                            className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--text-muted)] transition hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)]"
                          >
                            {tip}
                          </button>
                        ))}
                      </div>
                      <div className="ml-auto flex items-center gap-2">
              <button
                type="submit"
                          disabled={isSending || !input.trim()}
                          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] px-5 py-2 text-sm font-semibold text-[#1b1205] transition disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Send
              </button>
                      </div>
                    </div>
                  </div>
          </form>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}

