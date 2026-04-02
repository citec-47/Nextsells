'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Search, Edit, Send, ArrowLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface Conversation {
  otherUserId: string;
  otherUserName: string;
  otherUserRole: string;
  lastMessage: string;
  isRead: boolean;
  unreadCount?: number;
  lastAt: string;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  senderName: string;
}

type UserRole = 'BUYER' | 'SELLER' | 'ADMIN';

function RoleTag({ role }: { role: UserRole }) {
  const colors = {
    BUYER: 'bg-blue-100 text-blue-700',
    SELLER: 'bg-orange-100 text-orange-700',
    ADMIN: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${colors[role] ?? ''}`}>
      {role}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initial = (name ?? '?')[0]?.toUpperCase() ?? '?';
  return (
    <div className="w-10 h-10 rounded-full bg-[#1e2140] text-white text-sm font-bold flex items-center justify-center shrink-0">
      {initial}
    </div>
  );
}

export default function MessagesManagement() {
  const pathname = usePathname();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all');
  const [error, setError] = useState('');
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const [pagination, setPagination] = useState<{ hasMore: boolean; nextCursor: string | null }>({
    hasMore: false,
    nextCursor: null,
  });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (pathname?.startsWith('/seller')) {
      router.replace('/seller/messages');
    }
  }, [pathname, router]);

  const getToken = () =>
    typeof window !== 'undefined' ? (localStorage.getItem('token') ?? '') : '';

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/messages', {
        credentials: 'include',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load conversations');
      }

      if (json.success) {
        setConversations(json.data.conversations || []);
      }
      setError('');
    } catch (err) {
      console.error('Load conversations error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (userId: string, before?: string, appendOlder = false) => {
    try {
      const params = new URLSearchParams({ limit: '40' });
      if (before) {
        params.set('before', before);
      }
      const res = await fetch(`/api/admin/messages/${userId}?${params.toString()}`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load messages');
      }

      if (json.success) {
        const loadedMessages = json.data.messages || [];
        const nextPagination = json.data.pagination || { hasMore: false, nextCursor: null };
        setMessages((current) => (appendOlder ? [...loadedMessages, ...current] : loadedMessages));
        setPagination({
          hasMore: Boolean(nextPagination.hasMore),
          nextCursor: nextPagination.nextCursor || null,
        });
      }
      setError('');
    } catch (err) {
      console.error('Load messages error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    }
  }, []);

  const markConversationRead = useCallback(async (userId: string) => {
    try {
      await fetch('/api/messages/read', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participantId: userId }),
      });
    } catch {
      // Silent failure to avoid blocking conversation opening.
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  useEffect(() => {
    loadConversations();
    const timer = window.setInterval(() => {
      loadConversations();
      if (selectedUserId) {
        loadMessages(selectedUserId);
      }
    }, 4000);

    return () => window.clearInterval(timer);
  }, [loadConversations, loadMessages, selectedUserId]);

  const handleSelectConversation = (conversation: Conversation) => {
    const otherId = conversation.otherUserId;
    setSelectedUserId(otherId);
    setShowChatOnMobile(true);
    void markConversationRead(otherId).then(async () => {
      await loadMessages(otherId);
      await loadConversations();
    });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedUserId) return;

    const content = messageText.trim();
    setSending(true);
    try {
      const res = await fetch(`/api/admin/messages/${selectedUserId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to send message');
      }

      const optimisticMessage: Message = {
        id: String(json.data?.messageId || `optimistic-${Date.now()}`),
        senderId: 'ADMIN',
        receiverId: selectedUserId,
        content,
        isRead: true,
        createdAt: new Date().toISOString(),
        senderName: 'Admin',
      };

      setMessages((current) => [...current, optimisticMessage]);
      setConversations((current) => {
        const existing = current.find((c) => c.otherUserId === selectedUserId);
        if (!existing) return current;
        const updated: Conversation = {
          ...existing,
          lastMessage: content,
          lastAt: optimisticMessage.createdAt,
        };
        const remaining = current.filter((c) => c.otherUserId !== selectedUserId);
        return [updated, ...remaining];
      });

      setMessageText('');
      setError('');
      await loadMessages(selectedUserId);
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const filtered = useMemo(() => {
    let list = conversations;

    // Filter by role
    if (filterRole !== 'all') {
      list = list.filter((c) => c.otherUserRole === filterRole);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.otherUserName.toLowerCase().includes(q) ||
          c.lastMessage.toLowerCase().includes(q),
      );
    }

    return list;
  }, [conversations, filterRole, search]);

  const selectedConversation = conversations.find((c) => c.otherUserId === selectedUserId);
  const otherUser = selectedConversation
    ? selectedConversation.otherUserName
    : null;

  const fmtTime = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex h-full flex-col md:flex-row">
      {error ? (
        <div className="absolute top-3 left-1/2 z-10 -translate-x-1/2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}
      {/* Left panel: Conversations */}
      <div className={`w-full bg-white border-r border-gray-200 flex flex-col md:w-80 ${showChatOnMobile ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Messages</h2>
            <button className="text-gray-500 hover:text-gray-700">
              <Edit size={16} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-2 text-sm border rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'BUYER', 'SELLER'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setFilterRole(role === 'all' ? 'all' : role)}
                className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                  filterRole === role
                    ? 'bg-[#1e2140] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {role === 'all' ? 'All' : role}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">No conversations</div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.otherUserId}
                onClick={() => handleSelectConversation(c)}
                className={`p-3 border-b border-gray-100 cursor-pointer transition-colors ${
                  selectedUserId === c.otherUserId
                    ? 'bg-orange-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-2">
                  <Avatar name={c.otherUserName} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-gray-900 text-sm truncate">{c.otherUserName}</p>
                      <RoleTag role={c.otherUserRole as UserRole} />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 capitalize">
                      {c.lastMessage.split('Question about')[0]?.trim() || 'Subject'}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{c.lastMessage.substring(0, 50)}</p>
                  </div>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">{fmtTime(c.lastAt)}</span>
                </div>
                {(c.unreadCount || 0) > 0 && (
                  <div className="mt-1 flex justify-end">
                    <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {c.unreadCount}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right panel: Chat view */}
      {!selectedUserId ? (
        <div className={`flex-1 items-center justify-center flex-col gap-3 bg-gray-50 ${showChatOnMobile ? 'hidden md:flex' : 'flex'}`}>
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 8h10M7 12h4m1 8l-4-2H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 font-medium text-center">Select a conversation to start</p>
          <p className="text-gray-400 text-sm text-center max-w-xs">
            Or start a new conversation using the pencil button
          </p>
        </div>
      ) : (
        <div className={`flex-1 flex-col bg-gray-50 ${showChatOnMobile ? 'flex' : 'hidden md:flex'}`}>
          {/* Chat header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-gray-900">{otherUser}</p>
              <button
                type="button"
                onClick={() => setShowChatOnMobile(false)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 md:hidden"
              >
                <ArrowLeft size={12} />
                Back
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {pagination.hasMore && selectedUserId && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    void loadMessages(selectedUserId, pagination.nextCursor || undefined, true);
                  }}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Load older messages
                </button>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderId === selectedUserId ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[86%] break-words px-4 py-2 rounded-lg text-sm sm:max-w-xs ${
                    msg.senderId === selectedUserId
                      ? 'bg-white text-gray-900'
                      : 'bg-orange-500 text-white'
                  }`}
                >
                  {msg.content}
                  <p className={`text-[10px] mt-1 ${msg.senderId === selectedUserId ? 'text-gray-400' : 'text-orange-100'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-200 px-3 py-3 flex gap-2 sm:px-4">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button
              onClick={handleSendMessage}
              disabled={sending || !messageText.trim()}
              className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
