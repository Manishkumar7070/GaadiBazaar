import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { chatService, ChatMessage } from '@/services/chat.service';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface ChatWindowProps {
  sellerId: string;
  sellerName: string;
  vehicleId: string;
  vehicleTitle: string;
  onClose?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  sellerId, 
  sellerName, 
  vehicleId, 
  vehicleTitle,
  onClose 
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const id = await chatService.getOrCreateConversation(user.id, sellerId, vehicleId);
        setConversationId(id);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [user, sellerId, vehicleId]);

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = chatService.subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || !user || sending) return;

    setSending(true);
    try {
      await chatService.sendMessage(conversationId, user.id, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-slate-500">Initializing secure chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-primary p-6 text-white shrink-0 shadow-lg relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
            {sellerName[0]}
          </div>
          <div>
            <h3 className="font-bold leading-tight">Chat with {sellerName}</h3>
            <p className="text-white/70 text-[10px] uppercase font-black tracking-widest">Regarding {vehicleTitle}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 flex items-center justify-center mb-3">
               <User className="text-slate-400" />
            </div>
            <p className="text-sm font-medium">No messages yet. <br /> Start the conversation about this {vehicleTitle}.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === user?.id;
            return (
              <motion.div
                key={msg.id || idx}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex flex-col max-w-[85%]",
                  isMe ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className={cn(
                  "px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                  isMe 
                    ? "bg-primary text-white rounded-tr-none" 
                    : "bg-white text-slate-900 border border-slate-100 rounded-tl-none"
                )}>
                  {msg.text}
                </div>
                {msg.createdAt && (
                  <span className="text-[9px] text-slate-400 mt-1 font-bold">
                    {format(msg.createdAt.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt), 'h:mm a')}
                  </span>
                )}
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask about availability, price, or test drive..." 
            className="flex-1 bg-slate-50 border-none outline-none h-12 px-4 text-sm rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20"
            disabled={sending}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="h-12 w-12 rounded-xl shrink-0 shadow-lg shadow-primary/20"
            disabled={!newMessage.trim() || sending}
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
        <p className="text-[9px] text-slate-400 mt-2 text-center font-bold uppercase tracking-widest">
           Powered by Secure Real-time Messaging
        </p>
      </div>
    </div>
  );
};
