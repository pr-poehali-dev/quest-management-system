import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { useApp } from '@/lib/context';
import { getMessages, markRead, sendMessage, getAllUsers } from '@/lib/store';
import type { User } from '@/lib/db';

export default function MessagesPage() {
  const { currentUser, currentSite } = useApp();
  const [messages, setMessages] = useState<ReturnType<typeof getMessages>>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [msgContent, setMsgContent] = useState('');

  const reload = () => {
    if (!currentUser) return;
    setMessages(getMessages(currentUser.id));
    setAllUsers(getAllUsers().filter(u => u.id !== currentUser.id));
  };

  useEffect(() => { reload(); }, [currentUser]);

  const conversation = messages.filter(m =>
    selectedUser && (
      (m.sender_id === currentUser?.id && m.recipient_id === selectedUser.id) ||
      (m.sender_id === selectedUser.id && m.recipient_id === currentUser?.id)
    )
  ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgContent || !selectedUser || !currentUser || !currentSite) return;
    sendMessage(currentSite.id, currentUser.id, selectedUser.id, msgContent);
    setMsgContent('');
    reload();
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    messages.filter(m => m.sender_id === user.id && m.recipient_id === currentUser?.id && !m.is_read).forEach(m => markRead(m.id));
  };

  const unreadFrom = (userId: string) => messages.filter(m => m.sender_id === userId && m.recipient_id === currentUser?.id && !m.is_read).length;

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      {/* User List */}
      <div className="w-72 border-r border-border flex flex-col bg-sidebar">
        <div className="p-4 border-b border-border">
          <h2 className="font-display text-sm gold-text">Сообщения</h2>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {allUsers.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Нет пользователей</div>
          ) : (
            allUsers.map(user => {
              const unread = unreadFrom(user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`w-full px-4 py-3 flex items-center gap-3 transition-all text-left ${selectedUser?.id === user.id ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-muted/40 border-l-2 border-transparent'}`}
                >
                  <div className="w-9 h-9 rounded-full glass-card-violet flex items-center justify-center text-sm shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email || user.phone}</p>
                  </div>
                  {unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-3 float">💬</div>
              <p className="text-muted-foreground">Выберите собеседника</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-full glass-card-violet flex items-center justify-center text-sm">
                {selectedUser.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-sm">{selectedUser.name}</p>
                <p className="text-xs text-muted-foreground">{selectedUser.email || selectedUser.phone}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
              {conversation.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">Начните диалог</div>
              ) : (
                conversation.map(msg => {
                  const isMine = msg.sender_id === currentUser?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${isMine ? 'gold-btn rounded-br-sm' : 'glass-card rounded-bl-sm'}`}>
                        <p className={`text-sm ${isMine ? 'text-primary-foreground' : 'text-foreground'}`}>{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-border">
              <form onSubmit={handleSend} className="flex gap-3">
                <input
                  className="flex-1 bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  placeholder="Введите сообщение..."
                  value={msgContent}
                  onChange={e => setMsgContent(e.target.value)}
                />
                <button type="submit" className="gold-btn px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
                  <Icon name="Send" size={16} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
