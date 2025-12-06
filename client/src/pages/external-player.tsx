import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Eye, Send, CheckCircle, AlertCircle, Users, Loader2 } from "lucide-react";
import type { Room, ServerMessage } from "@shared/schema";

interface SpectatorState {
  room: Room | null;
  isConnected: boolean;
  wordsSubmitted: boolean;
  error: string | null;
}

export default function ExternalPlayer() {
  const { roomId, token } = useParams<{ roomId: string; token: string }>();
  const [category, setCategory] = useState("");
  const [playerWord, setPlayerWord] = useState("");
  const [spyWord, setSpyWord] = useState("");
  const [state, setState] = useState<SpectatorState>({
    room: null,
    isConnected: false,
    wordsSubmitted: false,
    error: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  const handleServerMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case "spectator_joined":
        setState((prev) => ({
          ...prev,
          room: message.data.room,
          error: null,
        }));
        break;
      case "external_words_set":
        setState((prev) => ({
          ...prev,
          wordsSubmitted: true,
        }));
        setIsSubmitting(false);
        break;
      case "room_updated":
      case "game_started":
      case "phase_changed":
      case "turn_changed":
      case "spy_revealed":
        setState((prev) => ({
          ...prev,
          room: message.data.room,
        }));
        break;
      case "error":
        setState((prev) => ({
          ...prev,
          error: message.data.message,
        }));
        setIsSubmitting(false);
        break;
    }
  }, []);

  useEffect(() => {
    if (!roomId || !token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setState((prev) => ({ ...prev, isConnected: true, error: null }));
      ws.send(JSON.stringify({
        type: "join_spectator",
        data: { roomCode: roomId, token },
      }));
    };

    ws.onclose = () => {
      setState((prev) => ({ ...prev, isConnected: false }));
    };

    ws.onerror = () => {
      setState((prev) => ({ ...prev, error: "حدث خطأ في الاتصال" }));
    };

    ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);
        handleServerMessage(message);
      } catch {
        console.error("Failed to parse message");
      }
    };

    socketRef.current = ws;

    return () => {
      ws.close();
    };
  }, [roomId, token, handleServerMessage]);

  const handleSubmit = () => {
    if (!category.trim() || !playerWord.trim() || !spyWord.trim()) {
      setState((prev) => ({ ...prev, error: "يرجى ملء جميع الحقول" }));
      return;
    }

    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setState((prev) => ({ ...prev, error: "غير متصل بالخادم" }));
      return;
    }

    setIsSubmitting(true);
    socketRef.current.send(JSON.stringify({
      type: "set_external_words",
      data: {
        roomCode: roomId,
        token,
        category: category.trim(),
        playerWord: playerWord.trim(),
        spyWord: spyWord.trim(),
      },
    }));
  };

  if (!roomId || !token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <h2 className="text-xl font-bold">رابط غير صالح</h2>
              <p className="text-muted-foreground">
                الرابط الذي تحاول الوصول إليه غير صالح أو منتهي الصلاحية
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!state.isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <h2 className="text-xl font-bold">جاري الاتصال...</h2>
              <p className="text-muted-foreground">
                يرجى الانتظار حتى يتم الاتصال بالغرفة
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.wordsSubmitted) {
    const room = state.room;
    const getPhaseLabel = () => {
      if (!room) return "";
      switch (room.phase) {
        case "lobby": return "في الانتظار";
        case "category_voting": return "اختيار الفئة";
        case "word_reveal": return "كشف الكلمات";
        case "questioning": return "الأسئلة";
        case "spy_voting": return "التصويت";
        case "spy_guess": return "تخمين الجاسوس";
        case "guess_validation": return "التحقق";
        case "results": return "النتائج";
        default: return "";
      }
    };

    return (
      <div className="min-h-screen bg-background p-4" dir="rtl">
        <div className="max-w-2xl mx-auto space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  <span>وضع المتفرج</span>
                </div>
                <Badge variant="secondary">{getPhaseLabel()}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>تم تحديد الكلمات - الفئة: {category}</span>
              </div>
            </CardContent>
          </Card>

          {room && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    اللاعبون ({room.players.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {room.players.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{
                            backgroundColor: `hsl(${(index * 40) % 360}, 50%, 50%)`,
                            color: "white",
                          }}
                        >
                          {player.name.charAt(0)}
                        </div>
                        <span className="text-sm">{player.name}</span>
                        {room.phase === "results" && player.role && (
                          <Badge variant={player.role === "spy" ? "destructive" : "default"} className="text-xs">
                            {player.role === "spy" ? "جاسوس" : "لاعب"}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{player.score} نقطة</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {room.messages.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">المحادثة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {room.messages.slice(-20).map((msg) => (
                        <div key={msg.id} className="text-sm">
                          <span className="font-medium">{msg.playerName}: </span>
                          <span className="text-muted-foreground">{msg.text}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {room.phase === "results" && room.spyVotes.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">نتائج التصويت</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {room.spyVotes.map((vote) => {
                        const voter = room.players.find(p => p.id === vote.voterId);
                        const suspect = room.players.find(p => p.id === vote.suspectId);
                        return (
                          <div key={vote.voterId} className="text-sm text-muted-foreground">
                            {voter?.name} صوت ضد {suspect?.name}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Eye className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">تعيين كلمات اللعبة</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            أنت مسؤول عن تحديد الكلمات لهذه الجولة. اختر كلمات مثيرة للاهتمام!
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
              {state.error}
            </div>
          )}

          {state.room && (
            <div className="p-3 rounded-lg bg-muted text-center">
              <div className="flex items-center justify-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                <span>الغرفة: {state.room.id}</span>
                <span className="text-muted-foreground">|</span>
                <span>{state.room.players.length} لاعبين</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="category">الفئة</Label>
            <Input
              id="category"
              placeholder="مثال: طعام، رياضة، حيوانات..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              data-testid="input-category"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="playerWord">كلمة اللاعبين</Label>
            <Input
              id="playerWord"
              placeholder="الكلمة التي سيعرفها اللاعبون العاديون"
              value={playerWord}
              onChange={(e) => setPlayerWord(e.target.value)}
              data-testid="input-player-word"
            />
            <p className="text-xs text-muted-foreground">
              هذه الكلمة ستظهر لجميع اللاعبين ما عدا الجاسوس
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="spyWord">كلمة الجاسوس</Label>
            <Input
              id="spyWord"
              placeholder="الكلمة التي سيعرفها الجاسوس"
              value={spyWord}
              onChange={(e) => setSpyWord(e.target.value)}
              data-testid="input-spy-word"
            />
            <p className="text-xs text-muted-foreground">
              هذه الكلمة ستظهر للجاسوس فقط (يجب أن تكون مشابهة لكلمة اللاعبين)
            </p>
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleSubmit}
            disabled={isSubmitting || !category.trim() || !playerWord.trim() || !spyWord.trim()}
            data-testid="button-submit-words"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                تأكيد الكلمات
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
