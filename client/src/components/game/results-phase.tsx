import { useEffect, useRef, useState, useCallback } from "react";
import { Trophy, Medal, Star, RotateCcw, Crown, Search, Settings, Minus, Plus, Bot, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGame } from "@/lib/game-context";
import { playResultSound } from "@/lib/sounds";
import { defaultGameSettings, getSpyCountForPlayers } from "@shared/schema";

export function ResultsPhase() {
  const { room, currentPlayer, isHost, nextRound, playerId, updateSpyCount, updateGuessValidationMode, updateGameSettings: updateServerSettings } = useGame();
  const soundPlayed = useRef(false);
  const [showSettings, setShowSettings] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dialogOpenRef = useRef(false);
  
  // Track dialog open state in ref for debounce guard
  useEffect(() => {
    dialogOpenRef.current = showSettings;
  }, [showSettings]);

  const [localSettings, setLocalSettings] = useState({
    questionsPerPlayer: room?.gameSettings?.questionsPerPlayer || defaultGameSettings.questionsPerPlayer,
    questionDuration: room?.gameSettings?.questionDuration || defaultGameSettings.questionDuration,
    answerDuration: room?.gameSettings?.answerDuration || defaultGameSettings.answerDuration,
    spyVotingDuration: room?.gameSettings?.spyVotingDuration || defaultGameSettings.spyVotingDuration,
    spyGuessDuration: room?.gameSettings?.spyGuessDuration || defaultGameSettings.spyGuessDuration,
  });

  useEffect(() => {
    if (room?.gameSettings) {
      setLocalSettings({
        questionsPerPlayer: room.gameSettings.questionsPerPlayer,
        questionDuration: room.gameSettings.questionDuration,
        answerDuration: room.gameSettings.answerDuration,
        spyVotingDuration: room.gameSettings.spyVotingDuration,
        spyGuessDuration: room.gameSettings.spyGuessDuration,
      });
    }
  }, [room?.gameSettings]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const updateGameSettings = useCallback((settings: Partial<typeof localSettings>) => {
    setLocalSettings(prev => ({ ...prev, ...settings }));
    
    // Clear any pending debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Schedule new update with guard check
    debounceTimeoutRef.current = setTimeout(() => {
      // Only send update if dialog is still open
      if (dialogOpenRef.current) {
        updateServerSettings(settings);
      }
    }, 300);
  }, [updateServerSettings]);

  const spyWon = room?.spyGuessCorrect !== undefined 
    ? room.spyGuessCorrect 
    : (room?.guessValidationVotes 
        ? room.guessValidationVotes.filter((v) => v.isCorrect).length >
          room.guessValidationVotes.filter((v) => !v.isCorrect).length 
        : false);

  const isSpy = room?.revealedSpyIds?.includes(playerId || "") || false;

  useEffect(() => {
    if (!soundPlayed.current && room) {
      const playerWon = isSpy ? spyWon : !spyWon;
      playResultSound(playerWon);
      soundPlayed.current = true;
    }
  }, [room, isSpy, spyWon]);

  if (!room || !currentPlayer) return null;

  const defaultSpyCount = getSpyCountForPlayers(room.players.length);

  const handleSpyCountChange = (delta: number) => {
    const newCount = Math.max(1, Math.min(room.spyCount + delta, Math.floor(room.players.length / 2)));
    updateSpyCount(newCount);
  };

  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);

  // Show all spies (by role), not just revealed ones
  const allSpies = room.players.filter((p) => p.role === "spy");
  // Show which spies were caught (voted for)
  const revealedSpies = room.players.filter((p) => room.revealedSpyIds.includes(p.id));
  const spyCaught = revealedSpies.length > 0 && revealedSpies.some(p => p.role === "spy");

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          نتائج الجولة {room.roundNumber}
        </h1>
        <Badge
          variant={spyWon ? "default" : "secondary"}
          className={`text-base px-4 py-1 ${spyWon ? "bg-spy" : "bg-player"}`}
        >
          {spyWon ? "فاز الجاسوس!" : "فاز اللاعبون!"}
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-spy" />
            الجواسيس في هذه الجولة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {allSpies.map((spy) => (
              <div
                key={spy.id}
                className={`flex items-center gap-2 p-2 rounded-lg border ${
                  room.revealedSpyIds.includes(spy.id)
                    ? "bg-spy/20 border-spy/40"
                    : "bg-spy/10 border-spy/20"
                }`}
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-spy text-spy-foreground text-sm">
                    {spy.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{spy.name}</span>
                {spy.id === playerId && (
                  <Badge variant="outline" className="text-xs">أنت</Badge>
                )}
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">الكلمة الأصلية</p>
              <p className="text-xl font-bold text-primary">{room.currentWord}</p>
            </div>
            {room.spyWord && (
              <div>
                <p className="text-sm text-muted-foreground">كلمة الجاسوس</p>
                <p className="text-xl font-bold text-spy">{room.spyWord}</p>
              </div>
            )}
          </div>
          {room.spyGuess && (
            <>
              <Separator className="my-4" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">تخمين الجاسوس</p>
                <p className="text-xl font-bold">"{room.spyGuess}"</p>
                <Badge variant={spyWon ? "default" : "destructive"} className="mt-2">
                  {spyWon ? "صحيح!" : "خاطئ!"}
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" />
            ترتيب النقاط
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sortedPlayers.map((player, index) => {
            const rank = index + 1;
            const isTopThree = rank <= 3;
            const bgColors = [
              "bg-gradient-to-l from-yellow-100 to-yellow-50 dark:from-yellow-900/40 dark:to-yellow-800/20 border-yellow-300 dark:border-yellow-700",
              "bg-gradient-to-l from-gray-100 to-gray-50 dark:from-gray-800/40 dark:to-gray-700/20 border-gray-300 dark:border-gray-600",
              "bg-gradient-to-l from-orange-100 to-orange-50 dark:from-orange-900/40 dark:to-orange-800/20 border-orange-300 dark:border-orange-700",
            ];
            const textColors = ["text-yellow-700 dark:text-yellow-400", "text-gray-600 dark:text-gray-300", "text-orange-600 dark:text-orange-400"];
            
            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  isTopThree ? bgColors[index] : "bg-muted/30 border-border"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-2xl font-bold w-10 ${isTopThree ? textColors[index] : "text-muted-foreground"}`}>
                    #{rank}
                  </span>
                  <Avatar className="w-10 h-10">
                    <AvatarFallback
                      className="text-base font-bold"
                      style={{
                        backgroundColor: `hsl(${(index * 40) % 360}, 50%, 50%)`,
                        color: "white",
                      }}
                    >
                      {player.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{player.name}</span>
                    {player.id === playerId && (
                      <Badge variant="outline" className="text-xs">أنت</Badge>
                    )}
                    {player.role === "spy" && (
                      <Badge variant="secondary" className="text-xs bg-spy/20 text-spy">جاسوس</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {rank === 1 && <Crown className="w-6 h-6 text-yellow-500" />}
                  {rank === 2 && <Medal className="w-5 h-5 text-gray-400" />}
                  {rank === 3 && <Star className="w-5 h-5 text-orange-400" />}
                  <span className="text-xl font-bold">({player.score})</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {isHost && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1 min-h-14 text-lg gap-2"
              onClick={nextRound}
              data-testid="button-next-round"
            >
              <RotateCcw className="w-5 h-5" />
              الجولة التالية
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="min-h-14 gap-2"
              onClick={() => setShowSettings(true)}
              data-testid="button-room-settings"
            >
              <Settings className="w-5 h-5" />
              الإعدادات
            </Button>
          </div>
        </div>
      )}

      {!isHost && (
        <p className="text-center text-muted-foreground">
          في انتظار القائد لبدء الجولة التالية...
        </p>
      )}

      <Dialog open={showSettings} onOpenChange={(open) => {
        // Clear pending debounce when closing dialog
        if (!open && debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
          debounceTimeoutRef.current = null;
        }
        setShowSettings(open);
      }}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              إعدادات الجولة القادمة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">عدد الجواسيس</p>
                <p className="text-sm text-muted-foreground">
                  الافتراضي: {defaultSpyCount} جاسوس
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleSpyCountChange(-1)}
                  disabled={room.spyCount <= 1}
                  data-testid="button-decrease-spy-results"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center font-bold text-lg">
                  {room.spyCount}
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleSpyCountChange(1)}
                  disabled={room.spyCount >= Math.floor(room.players.length / 2)}
                  data-testid="button-increase-spy-results"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="font-medium">عدد الأسئلة لكل لاعب</p>
              <div className="flex items-center gap-4">
                <Slider
                  value={[localSettings.questionsPerPlayer]}
                  onValueChange={(value) => updateGameSettings({ questionsPerPlayer: value[0] })}
                  min={1}
                  max={10}
                  step={1}
                  className="flex-1"
                  data-testid="slider-questions-per-player-results"
                />
                <span className="w-12 text-center font-bold text-lg">
                  {localSettings.questionsPerPlayer}
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="font-medium">مدة السؤال (ثانية)</p>
              <div className="flex items-center gap-4">
                <Slider
                  value={[localSettings.questionDuration]}
                  onValueChange={(value) => updateGameSettings({ questionDuration: value[0] })}
                  min={30}
                  max={300}
                  step={15}
                  className="flex-1"
                  data-testid="slider-question-duration-results"
                />
                <span className="w-12 text-center font-bold text-lg">
                  {localSettings.questionDuration}
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="font-medium">مدة الإجابة (ثانية)</p>
              <div className="flex items-center gap-4">
                <Slider
                  value={[localSettings.answerDuration]}
                  onValueChange={(value) => updateGameSettings({ answerDuration: value[0] })}
                  min={15}
                  max={120}
                  step={5}
                  className="flex-1"
                  data-testid="slider-answer-duration-results"
                />
                <span className="w-12 text-center font-bold text-lg">
                  {localSettings.answerDuration}
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="font-medium">مدة التصويت على الجاسوس (ثانية)</p>
              <div className="flex items-center gap-4">
                <Slider
                  value={[localSettings.spyVotingDuration]}
                  onValueChange={(value) => updateGameSettings({ spyVotingDuration: value[0] })}
                  min={15}
                  max={120}
                  step={5}
                  className="flex-1"
                  data-testid="slider-spy-voting-duration-results"
                />
                <span className="w-12 text-center font-bold text-lg">
                  {localSettings.spyVotingDuration}
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="font-medium">مدة تخمين الجاسوس (ثانية)</p>
              <div className="flex items-center gap-4">
                <Slider
                  value={[localSettings.spyGuessDuration]}
                  onValueChange={(value) => updateGameSettings({ spyGuessDuration: value[0] })}
                  min={15}
                  max={120}
                  step={5}
                  className="flex-1"
                  data-testid="slider-spy-guess-duration-results"
                />
                <span className="w-12 text-center font-bold text-lg">
                  {localSettings.spyGuessDuration}
                </span>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">التحقق من تخمين الجاسوس</p>
                <p className="text-sm text-muted-foreground">
                  {room.guessValidationMode === "system" 
                    ? "تلقائي: النظام يتحقق من صحة التخمين" 
                    : "يدوي: اللاعبون يصوتون على صحة التخمين"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant={room.guessValidationMode === "system" ? "default" : "outline"}
                  onClick={() => updateGuessValidationMode("system")}
                  className="gap-1"
                  data-testid="button-validation-system-results"
                >
                  <Bot className="w-4 h-4" />
                  تلقائي
                </Button>
                <Button
                  size="sm"
                  variant={room.guessValidationMode === "players" ? "default" : "outline"}
                  onClick={() => updateGuessValidationMode("players")}
                  className="gap-1"
                  data-testid="button-validation-players-results"
                >
                  <UsersRound className="w-4 h-4" />
                  يدوي
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
