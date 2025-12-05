import { useState, useEffect } from "react";
import { MessageCircle, Send, Clock, User, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useGame } from "@/lib/game-context";

export function QuestioningPhase() {
  const { room, currentPlayer, playerId, askQuestion, answerQuestion, endTurn, timerRemaining, doneWithQuestions } = useGame();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [localTimer, setLocalTimer] = useState(timerRemaining);

  // Update local timer when server sends updates
  useEffect(() => {
    setLocalTimer(timerRemaining);
  }, [timerRemaining]);

  // Countdown timer
  useEffect(() => {
    if (localTimer <= 0) return;
    const interval = setInterval(() => {
      setLocalTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [localTimer]);

  if (!room || !currentPlayer) return null;

  // Use currentTurnPlayerId for turn-based system
  const currentTurnPlayerId = room.currentTurnPlayerId || room.players[room.currentPlayerIndex]?.id;
  const currentTurnPlayer = room.players.find(p => p.id === currentTurnPlayerId);
  const isMyTurn = currentTurnPlayerId === playerId;
  const myQuestionsRemaining = currentPlayer.questionsRemaining ?? 3;
  const amDoneWithQuestions = currentPlayer.doneWithQuestions ?? false;
  const lastQuestion = room.questions[room.questions.length - 1];
  const needsAnswer = lastQuestion && !lastQuestion.answer && lastQuestion.targetId === playerId;

  const otherPlayers = room.players.filter((p) => p.id !== playerId);

  const handleAskQuestion = () => {
    if (selectedTarget && question.trim()) {
      askQuestion(selectedTarget, question.trim());
      setQuestion("");
      setSelectedTarget(null);
    }
  };

  const handleAnswer = () => {
    if (answer.trim()) {
      answerQuestion(answer.trim());
      setAnswer("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          جولة الأسئلة
        </h1>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Badge
            variant={isMyTurn ? "default" : "secondary"}
            className="gap-1 text-base px-4 py-1"
          >
            <User className="w-4 h-4" />
            دور: {currentTurnPlayer?.name}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <MessageCircle className="w-4 h-4" />
            {myQuestionsRemaining} أسئلة متبقية لك
          </Badge>
          {amDoneWithQuestions && (
            <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800">
              <CheckCircle className="w-4 h-4" />
              أنهيت أسئلتك
            </Badge>
          )}
        </div>
        {/* Timer display */}
        {localTimer > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-xl font-bold tabular-nums">
                {Math.floor(localTimer / 60)}:{(localTimer % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <Progress value={(localTimer / 60) * 100} className="h-2 w-48 mx-auto" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">الأسئلة والإجابات</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              {room.questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>لم يتم طرح أي أسئلة بعد</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {room.questions.map((q, index) => {
                    const asker = room.players.find((p) => p.id === q.askerId);
                    const target = room.players.find((p) => p.id === q.targetId);
                    return (
                      <div
                        key={index}
                        className="p-3 rounded-lg bg-muted/50 space-y-2"
                        data-testid={`question-${index}`}
                      >
                        <div className="flex items-start gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                              {asker?.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-medium">{asker?.name}</span>
                              <span className="text-muted-foreground"> سأل </span>
                              <span className="font-medium">{target?.name}</span>
                            </p>
                            <p className="mt-1 bg-background p-2 rounded-lg">
                              {q.question}
                            </p>
                          </div>
                        </div>
                        {q.answer && (
                          <div className="flex items-start gap-2 mr-10">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs bg-accent text-accent-foreground">
                                {target?.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{target?.name}</p>
                              <p className="mt-1 bg-background p-2 rounded-lg">
                                {q.answer}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {needsAnswer ? (
            <Card className="border-accent">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-accent">
                  <MessageCircle className="w-5 h-5" />
                  أجب على السؤال
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">السؤال:</p>
                  <p className="font-medium">{lastQuestion?.question}</p>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="اكتب إجابتك..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAnswer()}
                    data-testid="input-answer"
                  />
                  <Button onClick={handleAnswer} disabled={!answer.trim()} data-testid="button-send-answer">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : isMyTurn ? (
            <Card className="border-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <MessageCircle className="w-5 h-5" />
                  دورك - اطرح سؤالاً
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">اختر لاعباً:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {otherPlayers.map((player) => (
                      <Button
                        key={player.id}
                        variant={selectedTarget === player.id ? "default" : "outline"}
                        size="sm"
                        className="justify-start gap-2"
                        onClick={() => setSelectedTarget(player.id)}
                        data-testid={`button-select-player-${player.id}`}
                      >
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {player.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{player.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {selectedTarget && (
                  <div className="flex gap-2 animate-fade-in">
                    <Input
                      placeholder="اكتب سؤالك..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
                      data-testid="input-question"
                    />
                    <Button
                      onClick={handleAskQuestion}
                      disabled={!question.trim() || myQuestionsRemaining === 0}
                      data-testid="button-send-question"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1 gap-2"
                    onClick={endTurn}
                    data-testid="button-end-turn"
                  >
                    <CheckCircle className="w-4 h-4" />
                    انتقل للتالي
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={doneWithQuestions}
                    disabled={amDoneWithQuestions}
                    data-testid="button-done-questions"
                  >
                    <XCircle className="w-4 h-4" />
                    انتهيت من الأسئلة
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center space-y-4">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground animate-pulse" />
                <p className="text-lg font-medium">
                  انتظر دورك...
                </p>
                <p className="text-muted-foreground">
                  دور {currentTurnPlayer?.name} الآن
                </p>
                {!amDoneWithQuestions && myQuestionsRemaining > 0 && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={doneWithQuestions}
                    data-testid="button-done-questions-waiting"
                  >
                    <XCircle className="w-4 h-4" />
                    انتهيت من الأسئلة
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
