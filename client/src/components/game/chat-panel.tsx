import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useGame } from "@/lib/game-context";

export function ChatPanel() {
  const { room, playerId, sendChatMessage } = useGame();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [room?.messages]);

  if (!room) return null;

  const handleSend = () => {
    if (message.trim()) {
      sendChatMessage(message.trim());
      setMessage("");
    }
  };

  const getPlayerColor = (id: string) => {
    const index = room.players.findIndex((p) => p.id === id);
    return `hsl(${(index * 40) % 360}, 50%, 50%)`;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary" />
        <span className="font-medium">الدردشة</span>
      </div>

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
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
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback
                      className="text-xs text-white"
                      style={{ backgroundColor: getPlayerColor(msg.playerId) }}
                    >
                      {msg.playerName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`flex flex-col max-w-[75%] ${
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
      </ScrollArea>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Input
            placeholder="اكتب رسالتك..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
            data-testid="input-chat-message"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim()}
            data-testid="button-send-chat"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
