'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useTheme } from '@/components/providers/ThemeProvider';
import type { CaseCommunicationMessage } from '@/types';
import { asUser } from '@/lib/type-guards';
import { getErrorMessage } from '@/lib/error-message';

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getSenderName = (message: CaseCommunicationMessage) => {
  if (typeof message.sender === 'string') {
    return 'Participant';
  }
  const sender = asUser(message.sender);
  return sender?.name ?? 'Participant';
};

export function CaseCommunicationPanel({
  caseId,
  isEnabled,
}: {
  caseId: string;
  isEnabled: boolean;
}) {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isDarkMode = theme === 'dark';

  const {
    data: communication,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['case-communication', caseId],
    queryFn: () => api.getCaseCommunication(caseId),
    enabled: isEnabled,
    refetchInterval: isEnabled ? 10000 : false,
  });

  const markReadMutation = useMutation({
    mutationFn: () => api.markCaseMessagesRead(caseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-communication', caseId] });
      queryClient.invalidateQueries({ queryKey: ['communication-threads'] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to sync read state'));
    },
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      api.sendCaseMessage(caseId, {
        content,
      }),
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['case-communication', caseId] });
      queryClient.invalidateQueries({ queryKey: ['communication-threads'] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to send message'));
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [communication?.messages.length]);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }
    if (!communication?.unreadCount || markReadMutation.isPending) {
      return;
    }
    markReadMutation.mutate();
  }, [communication?.unreadCount, isEnabled, markReadMutation]);

  const participantsLabel = useMemo(() => {
    const participantNames = (communication?.participants ?? [])
      .filter((participant) => participant._id !== user?._id)
      .map((participant) => participant.name);

    if (!participantNames.length) {
      return 'No participants available';
    }

    return participantNames.join(' • ');
  }, [communication?.participants, user?._id]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = draft.trim();
    if (!value.length || sendMutation.isPending || !isEnabled) {
      return;
    }
    sendMutation.mutate(value);
  };

  if (!isEnabled) {
    return (
      <div id="communication" className="brand-card p-6 mb-6">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <MessageSquare className="h-4 w-4" />
          <h3 className="text-sm font-medium">Case Communication</h3>
        </div>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Assign a lawyer to this case to start secure communication chat.
        </p>
      </div>
    );
  }

  return (
    <div id="communication" className="brand-card p-6 mb-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <MessageSquare className="h-4 w-4" />
            <h3 className="text-sm font-medium">Case Communication</h3>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{participantsLabel}</p>
        </div>
        {isFetching && (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Syncing
          </span>
        )}
      </div>

      <div
        className={`mt-4 max-h-[400px] overflow-y-auto rounded-2xl border p-4 ${
          isDarkMode
            ? 'border-white/10 bg-[#0c1533]'
            : 'border-white/10 bg-[var(--surface-muted)]'
        }`}
      >
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : communication?.messages.length ? (
          <div className="space-y-4">
            {communication.messages.map((message) => {
              const sender = asUser(message.sender);
              const isMine =
                (sender && sender._id === user?._id) ||
                (typeof message.sender === 'string' && message.sender === user?._id);

              return (
                <div
                  key={message._id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl border px-4 py-3 text-sm ${
                      isMine
                        ? 'border-transparent bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] shadow-sm'
                        : isDarkMode
                          ? 'border-[#2a3c74] bg-[#16244d] text-[#f4f7ff] shadow-sm shadow-black/20'
                          : 'border-white/10 bg-white/80 text-[var(--text-primary)] shadow-sm'
                    }`}
                  >
                    <p className="text-xs font-semibold opacity-85">
                      {isMine ? 'You' : getSenderName(message)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
                    <p className="mt-2 text-[11px] opacity-70">
                      {formatTimestamp(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-[var(--text-muted)]">
            No messages yet. Start the conversation for this case.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                if (!sendMutation.isPending && draft.trim()) {
                  sendMutation.mutate(draft.trim());
                }
              }
            }}
            placeholder="Write a message about this case..."
            rows={3}
            className="w-full resize-none rounded-2xl border border-white/10 bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] focus:border-[#d5b47f] focus:outline-none"
            disabled={sendMutation.isPending}
          />
          <button
            type="submit"
            disabled={sendMutation.isPending || !draft.trim()}
            className="inline-flex min-w-[7rem] shrink-0 whitespace-nowrap items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] px-5 py-3 text-sm font-semibold text-[#1b1205] disabled:cursor-not-allowed disabled:opacity-50 sm:self-end"
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
