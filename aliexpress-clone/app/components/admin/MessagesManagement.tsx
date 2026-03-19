'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Search, Edit, Send } from 'lucide-react';

interface Conversation {
  user1: string;
  user2: string;
  lastMessage: string;
  isRead: boolean;
  lastAt: string;
  user1Name: string;
  user1Role: string;
  user2Name: string;
  user2Role: string;
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all');

  const getToken = () =>
    typeof window !== 'undefined' ? (localStorage.getItem('token') ?? '') : '';

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/messages', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success) setConversations(json.data);
    } catch (err) {
      console.error('Load conversations error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const loadMessages = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/messages/${userId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success) setMessages(json.data);
    } catch (err) {
      console.error('Load messages error:', err);
    }
  }, []);

  const handleSelectConversation = (conversation: Conversation) => {
    const otherId = conversation.user1;
    setSelectedUserId(otherId);
    loadMessages(otherId);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedUserId) return;

    setSending(true);
    try {
      const res = await fetch(`/api/admin/messages/${selectedUserId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: messageText }),
      });
      if ((await res.json()).success) {
        setMessageText('');
        await loadMessages(selectedUserId);
      }
    } finally {
      setSending(false);
    }
  };

  const filtered = useMemo(() => {
    let list = conversations;

    // Filter by role
    if (filterRole !== 'all') {
      list = list.filter((c) => c.user1Role === filterRole || c.user2Role === filterRole);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.user1Name.toLowerCase().includes(q) ||
          c.user2Name.toLowerCase().includes(q) ||
          c.lastMessage.toLowerCase().includes(q),
      );
    }

    return list;
  }, [conversations, filterRole, search]);

  const selectedConversation = conversations.find((c) => c.user1 === selectedUserId);
  const otherUser = selectedConversation
    ? selectedConversation.user2Name
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
    <div className="h-full flex">
      {/* Left panel: Conversations */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
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
                key={`${c.user1}-${c.user2}`}
                onClick={() => handleSelectConversation(c)}
                className={`p-3 border-b border-gray-100 cursor-pointer transition-colors ${
                  selectedUserId === c.user1
                    ? 'bg-orange-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-2">
                  <Avatar name={c.user1Name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-gray-900 text-sm truncate">{c.user1Name}</p>
                      <RoleTag role={c.user1Role as UserRole} />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 capitalize">
                      {c.lastMessage.split('Question about')[0]?.trim() || 'Subject'}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{c.lastMessage.substring(0, 50)}</p>
                  </div>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">{fmtTime(c.lastAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right panel: Chat view */}
      {!selectedUserId ? (
        <div className="flex-1 flex items-center justify-center flex-col gap-3 bg-gray-50">
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
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Chat header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <p className="font-semibold text-gray-900">{otherUser}</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderId === 'ADMIN_USER' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                    msg.senderId === 'ADMIN_USER'
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-900'
                  }`}
                >
                  {msg.content}
                  <p className={`text-[10px] mt-1 ${msg.senderId === 'ADMIN_USER' ? 'text-orange-100' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-200 px-4 py-3 flex gap-2">
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
