import { useState, useRef, useEffect, useCallback } from "react";
import { Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useGame } from "@/lib/game-context";
import { playMessageSound, resumeAudioContext } from "@/lib/sounds";

export function ChatPopover() {
  const { room, playerId, sendChatMessage } = useGame();
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastSeenMessageCount = useRef(0);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [room?.messages, isOpen]);

  useEffect(() => {
    if (!room?.messages) return;
    
    const currentCount = room.messages.length;
    
    if (currentCount > lastSeenMessageCount.current) {
      const newMessages = room.messages.slice(lastSeenMessageCount.current);
      
      const hasNewFromOthers = newMessages.some(msg => msg.playerId !== playerId);
      if (hasNewFromOthers) {
        playMessageSound();
      }
      
      if (!isOpenRef.current) {
        const unseenFromOthers = newMessages.filter(msg => msg.playerId !== playerId).length;
        setUnreadCount(prev => prev + unseenFromOthers);
      }
      
      lastSeenMessageCount.current = currentCount;
    }
  }, [room?.messages, playerId]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (open) {
      setUnreadCount(0);
      if (room?.messages) {
        lastSeenMessageCount.current = room.messages.length;
      }
    }
  }, [room?.messages]);

  if (!room) return null;

  const handleSend = () => {
    if (message.trim()) {
      resumeAudioContext();
      sendChatMessage(message.trim());
      setMessage("");
    }
  };

  const getPlayerColor = (id: string) => {
    const index = room.players.findIndex((p) => p.id === id);
    return `hsl(${(index * 40) % 360}, 50%, 50%)`;
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="relative"
          data-testid="button-chat-toggle"
        >
          <MessageCircle className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-xs"
              data-testid="badge-unread-count"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 h-96 p-0 flex flex-col"
        align="end"
        sideOffset={8}
      >
        <div className="p-3 border-b border-border flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <span className="font-medium">الدردشة</span>
        </div>

        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-3"
        >
          {room.messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">لا توجد رسائل بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {room.messages.map((msg) => {
                const isMe = msg.playerId === playerId;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                    data-testid={`message-${msg.id}`}
                  >
                    <Avatar className="w-7 h-7 shrink-0">
                      <AvatarFallback
                        className="text-xs text-white"
                        style={{ backgroundColor: getPlayerColor(msg.playerId) }}
                      >
                        {msg.playerName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`flex flex-col max-w-[70%] ${
                        isMe ? "items-end" : "items-start"
                      }`}
                    >
                      <span className="text-xs text-muted-foreground mb-1">
                        {msg.playerName}
                      </span>
                      <div
                        className={`p-2 rounded-lg text-sm ${
                          isMe
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString("ar-SA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-border">
          <div className="flex gap-2">
            <Input
              placeholder="اكتب رسالتك..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1"
              data-testid="input-chat-message-popover"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!message.trim()}
              data-testid="button-send-chat-popover"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
