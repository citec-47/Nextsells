'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ModernHeader from '@/app/components/common/ModernHeader';

type Contact = {
  userId: string;
  name: string;
  role: string;
  hasConversation: boolean;
  unreadCount: number;
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

export default function BuyerMessagesPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [error, setError] = useState('');
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }, []);

  const markConversationRead = useCallback(async (participantId: string) => {
    await fetch('/api/messages/read', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ participantId }),
    });
  }, [getAuthHeaders]);

  const load = async () => {
    try {
      const response = await fetch('/api/buyer/messages', {
        credentials: 'include',
        headers: {
          ...getAuthHeaders(),
        },
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to load messages');
      }

      setContacts(json.data.contacts || []);
      setMessages(json.data.messages || []);
      setCurrentUserId(json.data.currentUserId || null);
      setError('');

      const loadedContacts = (json.data.contacts || []) as Contact[];
      const selectedStillExists = selectedUserId
        ? loadedContacts.some((contact) => contact.userId === selectedUserId)
        : false;

      if (!selectedStillExists) {
        if (loadedContacts.length > 0) {
          setSelectedUserId(loadedContacts[0].userId);
        } else {
          setSelectedUserId(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 3500);

    return () => {
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      return;
    }

    void markConversationRead(selectedUserId).then(() => {
      setContacts((current) => current.map((contact) => (
        contact.userId === selectedUserId
          ? { ...contact, unreadCount: 0 }
          : contact
      )));
      setMessages((current) => current.map((msg) => (
        msg.senderId === selectedUserId && msg.receiverId === currentUserId
          ? { ...msg, isRead: true }
          : msg
      )));
    });
  }, [currentUserId, markConversationRead, selectedUserId]);

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

  const filteredContacts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((contact) =>
      contact.name.toLowerCase().includes(q) || contact.role.toLowerCase().includes(q)
    );
  }, [contacts, searchText]);

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.userId === selectedUserId) || null,
    [contacts, selectedUserId]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [visibleMessages]);

  const formatMessageTime = (value: string) =>
    new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim() || !selectedUserId) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/buyer/messages', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          receiverId: selectedUserId,
          content: text,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to send message');
      }

      const sent = json.data?.message as ChatMessage | undefined;
      if (sent) {
        setMessages((current) => {
          const withoutDuplicate = current.filter((item) => item.id !== sent.id);
          return [...withoutDuplicate, sent];
        });
      }

      setText('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectContact = async (contactUserId: string) => {
    if (!contactUserId || isBootstrapping) {
      return;
    }

    setSelectedUserId(contactUserId);
    setShowChatOnMobile(true);
    setError('');
    setIsBootstrapping(true);
    try {
      const response = await fetch('/api/buyer/messages', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          receiverId: contactUserId,
          bootstrapOnly: true,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to open conversation');
      }

      await markConversationRead(contactUserId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open conversation');
    } finally {
      setIsBootstrapping(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <ModernHeader />
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Messages</h1>

        {error && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading messages...</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[320px_1fr]">
            <div className={`rounded-xl border border-slate-200 bg-white ${showChatOnMobile ? 'hidden lg:block' : 'block'}`}>
              <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">Your Sellers</div>
              <div className="border-b border-slate-100 p-3">
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search sellers..."
                  className="h-9 w-full rounded-lg border border-slate-300 px-3 text-xs outline-none focus:border-slate-500"
                />
              </div>
              <div className="max-h-[520px] overflow-y-auto">
                {filteredContacts.length === 0 ? (
                  <p className="p-3 text-xs text-slate-500">No sellers available yet. Place an order first to start chatting.</p>
                ) : (
                  filteredContacts.map((contact) => (
                    <button
                      key={contact.userId}
                      onClick={() => {
                        void handleSelectContact(contact.userId);
                      }}
                      disabled={isBootstrapping}
                      className={`w-full border-b border-slate-100 px-3 py-2 text-left ${selectedUserId === contact.userId ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">{contact.name}</p>
                          <p className="text-[11px] text-slate-500">{contact.hasConversation ? 'Open chat' : 'Start chat'}</p>
                        </div>
                        {contact.unreadCount > 0 && (
                          <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                            {contact.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className={`flex h-[68vh] min-h-[460px] flex-col rounded-xl border border-slate-200 bg-white ${showChatOnMobile ? 'block' : 'hidden lg:flex'}`}>
              <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <span>{selectedContact ? `Chat with ${selectedContact.name}` : 'Chat'}</span>
                  <button
                    type="button"
                    onClick={() => setShowChatOnMobile(false)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 lg:hidden"
                  >
                    Back
                  </button>
                </div>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {visibleMessages.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    {selectedContact
                      ? `No messages yet with ${selectedContact.name}. Send the first message now.`
                      : 'Select a seller to begin chatting.'}
                  </p>
                ) : (
                  visibleMessages.map((msg) => {
                    const isOwnMessage = currentUserId ? msg.senderId === currentUserId : false;
                    const senderLabel = isOwnMessage ? 'You' : (msg.senderName || 'Seller');
                    return (
                      <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[86%] rounded-2xl px-3 py-2 text-sm shadow-sm sm:max-w-[78%] ${isOwnMessage ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                          <p className={`mb-1 text-[10px] font-semibold ${isOwnMessage ? 'text-blue-100' : 'text-slate-500'}`}>
                            {senderLabel}
                          </p>
                          <p className="break-words">{msg.content}</p>
                          <p className={`mt-1 text-[10px] ${isOwnMessage ? 'text-blue-100' : 'text-slate-500'}`}>
                            {formatMessageTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-100 p-3">
                <input
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={selectedUserId ? 'Type your message...' : 'Select a seller to start messaging'}
                  disabled={!selectedUserId}
                  className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
                />
                <button
                  type="submit"
                  disabled={isSending || !text.trim() || !selectedUserId}
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
