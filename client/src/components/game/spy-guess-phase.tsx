import { useState, useEffect, useRef } from "react";
import { Search, Send, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useGame } from "@/lib/game-context";
import { playTimerWarningSound } from "@/lib/sounds";

export function SpyGuessPhase() {
  const { room, currentPlayer, playerId, submitGuess, timerRemaining } = useGame();
  const [guess, setGuess] = useState("");
  const [localTimer, setLocalTimer] = useState(timerRemaining || 120);
  const playedWarning = useRef(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRemaining > 0) {
      setLocalTimer(timerRemaining);
      if (timerRemaining > 10) {
        playedWarning.current = false;
      }
    }
  }, [timerRemaining]);

  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (room?.phase !== "spy_guess") return;

    timerIntervalRef.current = setInterval(() => {
      setLocalTimer((prev) => {
        if (prev <= 0) return 0;
        const newVal = prev - 1;
        if (newVal === 10 && !playedWarning.current) {
          playTimerWarningSound();
          playedWarning.current = true;
        }
        return newVal;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [room?.phase]);

  if (!room || !currentPlayer) return null;

  const revealedSpies = room.players.filter((p) =>
    room.revealedSpyIds.includes(p.id)
  );
  const currentSpy = revealedSpies[0];
  const isCurrentSpy = currentSpy?.id === playerId;
  const hasGuessed = !!room.spyGuess;

  const handleSubmitGuess = () => {
    if (guess.trim()) {
      submitGuess(guess.trim());
      setGuess("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          الجاسوس يخمّن!
        </h1>
        <p className="text-muted-foreground">
          تم الكشف عن الجاسوس - الآن فرصته الأخيرة للفوز
        </p>
        
        {localTimer > 0 && !hasGuessed && (
          <div className="mt-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className={`w-5 h-5 ${localTimer <= 10 ? 'text-destructive animate-pulse' : 'text-spy'}`} />
              <span className={`text-xl font-bold tabular-nums ${localTimer <= 10 ? 'text-destructive' : ''}`}>
                {Math.floor(localTimer / 60)}:{(localTimer % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <Progress value={(localTimer / 120) * 100} className="h-2 w-48 mx-auto" />
          </div>
        )}
        
        {localTimer === 0 && !hasGuessed && (
          <div className="mt-4 text-center">
            <p className="text-destructive font-medium animate-pulse">انتهى الوقت - لم يتم التخمين...</p>
          </div>
        )}
      </div>

      <Card className="border-spy">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-center gap-3">
            <div className="p-3 bg-spy rounded-full">
              <Search className="w-6 h-6 text-spy-foreground" />
            </div>
            <span className="text-spy">الجاسوس هو</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex flex-col items-center gap-4">
            {revealedSpies.map((spy, index) => (
              <div key={spy.id} className="flex items-center gap-3">
                <Avatar className="w-16 h-16">
                  <AvatarFallback
                    className="text-2xl font-bold bg-spy text-spy-foreground"
                  >
                    {spy.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <p className="text-2xl font-bold">{spy.name}</p>
                  {spy.id === playerId && (
                    <Badge variant="outline" className="text-spy">
                      أنت الجاسوس!
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isCurrentSpy && !hasGuessed ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              فرصتك الأخيرة!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              خمّن الكلمة الصحيحة للفوز بنقطة إضافية
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="اكتب تخمينك للكلمة..."
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitGuess()}
                className="text-lg"
                data-testid="input-spy-guess"
              />
              <Button
                size="lg"
                onClick={handleSubmitGuess}
                disabled={!guess.trim()}
                data-testid="button-submit-guess"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : hasGuessed ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-lg font-medium mb-2">تخمين الجاسوس:</p>
            <p className="text-2xl font-bold text-foreground">
              "{room.spyGuess}"
            </p>
            <p className="text-muted-foreground mt-4">
              في انتظار تصويت اللاعبين على صحة الإجابة...
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-lg font-medium">
              انتظر تخمين الجاسوس...
            </p>
            <p className="text-muted-foreground">
              {currentSpy?.name} يفكر في الكلمة
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
