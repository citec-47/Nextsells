'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Conversation = {
  key: string;
  otherUserId: string;
  otherUserName: string;
  otherUserRole: string;
  lastMessage: string;
  lastAt: string;
};

type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

export default function SellerMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/seller/messages', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to load messages');
      }

      setConversations(json.data.conversations || []);
      setMessages(json.data.messages || []);
      setCurrentUserId(json.data.currentUserId || null);
      if (!selectedUserId && (json.data.conversations || []).length > 0) {
        setSelectedUserId(json.data.conversations[0].otherUserId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleMessages = useMemo(
    () =>
      messages
        .filter((msg) => {
          if (!selectedUserId) return false;
          return msg.senderId === selectedUserId || msg.receiverId === selectedUserId;
        })
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages, selectedUserId]
  );

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;

    setIsSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/seller/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          receiverId: selectedUserId || undefined,
          content: text,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to send message');
      }

      setText('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Messages</h1>

        {error && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading messages...</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[280px_1fr]">
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">Conversations</div>
              <div className="max-h-[520px] overflow-y-auto">
                {conversations.length === 0 ? (
                  <p className="p-3 text-xs text-slate-500">No conversations yet.</p>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.key}
                      onClick={() => setSelectedUserId(conv.otherUserId)}
                      className={`w-full border-b border-slate-100 px-3 py-2 text-left ${selectedUserId === conv.otherUserId ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                    >
                      <p className="text-sm font-semibold text-slate-800">{conv.otherUserName}</p>
                      <p className="line-clamp-1 text-xs text-slate-500">{conv.lastMessage}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex h-[560px] flex-col rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">Chat</div>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {visibleMessages.length === 0 ? (
                  <p className="text-xs text-slate-500">Select a conversation or send your first message.</p>
                ) : (
                  visibleMessages.map((msg) => {
                    const isOwnMessage = currentUserId ? msg.senderId === currentUserId : false;
                    return (
                    <div
                      key={msg.id}
                      className={`max-w-[78%] rounded-lg px-3 py-2 text-sm ${isOwnMessage ? 'ml-auto bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}
                    >
                      <p>{msg.content}</p>
                      <p className={`mt-1 text-[10px] ${isOwnMessage ? 'text-blue-100' : 'text-slate-500'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  );})
                )}
              </div>
              <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-100 p-3">
                <input
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Type your message..."
                  className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
                />
                <button
                  type="submit"
                  disabled={isSending || !text.trim()}
                  className="h-10 rounded-lg bg-[#173b62] px-4 text-xs font-semibold text-white hover:bg-[#12304f] disabled:opacity-60"
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
