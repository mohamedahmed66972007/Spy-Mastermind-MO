
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Users, CheckCircle, Search, Eye, MessageCircle, Vote, Trophy } from "lucide-react";
import type { Room, ServerMessage } from "@db/schema";

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
    socketRef.current = ws;

    ws.onopen = () => {
      setState((prev) => ({ ...prev, isConnected: true }));
      ws.send(
        JSON.stringify({
          type: "join_spectator",
          data: { roomCode: roomId, token },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleServerMessage(message);
      } catch (error) {
        console.error("Failed to parse message:", error);
      }
    };

    ws.onclose = () => {
      setState((prev) => ({ ...prev, isConnected: false }));
    };

    ws.onerror = () => {
      setState((prev) => ({
        ...prev,
        error: "فشل الاتصال بالخادم",
        isConnected: false,
      }));
    };

    return () => {
      ws.close();
    };
  }, [roomId, token, handleServerMessage]);

  const handleSubmitWords = () => {
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
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <h2 className="text-xl font-bold">جارٍ الاتصال...</h2>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض معلومات اللعبة للمشاهد
  if (state.wordsSubmitted && state.room) {
    const room = state.room;
    const spies = room.players.filter(p => p.role === "spy");
    const revealedSpies = room.players.filter(p => room.revealedSpyIds.includes(p.id));
    
    const getPhaseText = (phase: string) => {
      const phases: Record<string, string> = {
        lobby: "غرفة الانتظار",
        category_voting: "التصويت على الفئة",
        word_reveal: "كشف الكلمات",
        questioning: "جولة الأسئلة",
        spy_voting: "التصويت على الجاسوس",
        spy_guess: "تخمين الجاسوس",
        guess_validation: "التحقق من التخمين",
        results: "النتائج"
      };
      return phases[phase] || phase;
    };

    return (
      <div className="min-h-screen bg-background p-4" dir="rtl">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-6 h-6 text-primary" />
                  <span>وضع المشاهدة</span>
                </div>
                <Badge variant="outline" className="text-lg">
                  الغرفة: {room.id}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">المرحلة</p>
                  <p className="font-bold">{getPhaseText(room.phase)}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">الجولة</p>
                  <p className="font-bold">#{room.roundNumber}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">اللاعبون</p>
                  <p className="font-bold">{room.players.length}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">الجواسيس</p>
                  <p className="font-bold text-spy">{spies.length}</p>
                </div>
              </div>

              {room.selectedCategory && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">التصنيف</p>
                  <p className="text-2xl font-bold text-primary">{room.selectedCategory}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* معلومات الكلمات */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  الكلمات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-player/10 border border-player/20 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">كلمة اللاعبين</p>
                  <p className="text-2xl font-bold text-player">{room.currentWord || "لم تُختر بعد"}</p>
                </div>
                {room.spyWord && (
                  <div className="p-4 bg-spy/10 border border-spy/20 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">كلمة الجاسوس</p>
                    <p className="text-2xl font-bold text-spy">{room.spyWord}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* معلومات الجواسيس */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-spy" />
                  الجواسيس
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {spies.length > 0 ? (
                  spies.map((spy, index) => (
                    <div
                      key={spy.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        revealedSpies.some(s => s.id === spy.id)
                          ? "bg-spy/20 border-spy/40"
                          : "bg-spy/10 border-spy/20"
                      }`}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-spy text-spy-foreground">
                          {spy.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{spy.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {revealedSpies.some(s => s.id === spy.id) ? "تم الكشف عنه" : "لم يُكتشف بعد"}
                        </p>
                      </div>
                      {revealedSpies.some(s => s.id === spy.id) && (
                        <Badge variant="destructive">مكشوف</Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    لم يتم تحديد الجواسيس بعد
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* الأسئلة والإجابات */}
          {room.questions && room.questions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  الأسئلة والإجابات ({room.questions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {room.questions.map((q, index) => {
                      const asker = room.players.find(p => p.id === q.askerId);
                      const target = room.players.find(p => p.id === q.targetId);
                      return (
                        <div
                          key={index}
                          className="p-4 rounded-lg bg-muted/50 space-y-3"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {asker?.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm mb-2">
                                <span className="font-medium">{asker?.name}</span>
                                <span className="text-muted-foreground"> سأل </span>
                                <span className="font-medium">{target?.name}</span>
                              </p>
                              <div className="bg-background p-3 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">السؤال:</p>
                                <p>{q.question}</p>
                              </div>
                            </div>
                          </div>
                          {q.answer && (
                            <div className="flex items-start gap-3 mr-13">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-accent text-accent-foreground">
                                  {target?.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-sm font-medium mb-2">{target?.name}</p>
                                <div className="bg-background p-3 rounded-lg">
                                  <p className="text-sm text-muted-foreground mb-1">الإجابة:</p>
                                  <p>{q.answer}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* ترتيب اللاعبين */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-warning" />
                ترتيب اللاعبين
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...room.players]
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
                  .map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold w-8">#{index + 1}</span>
                        <Avatar className="w-10 h-10">
                          <AvatarFallback
                            style={{
                              backgroundColor: `hsl(${(index * 40) % 360}, 50%, 50%)`,
                              color: "white",
                            }}
                          >
                            {player.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{player.name}</p>
                          {player.role === "spy" && (
                            <Badge variant="secondary" className="text-xs bg-spy/20 text-spy">
                              جاسوس
                            </Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-xl font-bold">({player.score || 0})</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="w-6 h-6" />
              <span>تحديد كلمات اللعبة</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <p className="text-sm text-destructive">{state.error}</p>
            </div>
          )}

          {state.room && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
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
            className="w-full"
            onClick={handleSubmitWords}
            disabled={isSubmitting || !category || !playerWord || !spyWord}
            data-testid="button-submit-words"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                جارٍ الإرسال...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 ml-2" />
                تأكيد الكلمات
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
