import { useState, useEffect, useCallback } from "react";
import { Crown, Check, Clock, Play, Settings, Users, Minus, Plus, Bot, UsersRound, Eye, Copy, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useGame } from "@/lib/game-context";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { getMinPlayersForStart, getMaxPlayers, getSpyCountForPlayers, defaultGameSettings } from "@shared/schema";

export function LobbyPhase() {
  const { room, currentPlayer, isHost, toggleReady, startGame, updateSpyCount, updateGuessValidationMode, updateWordSource, updateGameSettings: updateServerSettings } = useGame();
  const { toast } = useToast();
  const [copiedRoom, setCopiedRoom] = useState(false);
  const [copiedExternal, setCopiedExternal] = useState(false);

  // Local state for smooth slider updates
  const [localSettings, setLocalSettings] = useState({
    questionsPerPlayer: room?.gameSettings?.questionsPerPlayer || defaultGameSettings.questionsPerPlayer,
    questionDuration: room?.gameSettings?.questionDuration || defaultGameSettings.questionDuration,
    answerDuration: room?.gameSettings?.answerDuration || defaultGameSettings.answerDuration,
    spyVotingDuration: room?.gameSettings?.spyVotingDuration || defaultGameSettings.spyVotingDuration,
    spyGuessDuration: room?.gameSettings?.spyGuessDuration || defaultGameSettings.spyGuessDuration,
  });

  // Sync local state with room settings when they change from server
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

  // Debounced update function
  const debouncedUpdate = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (settings: Partial<typeof localSettings>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          updateServerSettings(settings);
        }, 300); // 300ms delay
      };
    })(),
    [updateServerSettings]
  );

  // Update local state immediately and schedule server update
  const updateGameSettings = (settings: Partial<typeof localSettings>) => {
    setLocalSettings(prev => ({ ...prev, ...settings }));
    debouncedUpdate(settings);
  };

  if (!room || !currentPlayer) return null;

  const minPlayers = getMinPlayersForStart(room.gameMode);
  const maxPlayers = getMaxPlayers();
  const readyPlayers = room.players.filter((p) => p.isReady || p.isHost).length;
  const allReady = room.players.every((p) => p.isReady || p.isHost);

  const wordSource = room.wordSource || "system";
  const hasExternalWords = wordSource === "external" && room.externalWords;
  const canStart = room.players.length >= minPlayers && allReady && (wordSource !== "external" || hasExternalWords);
  const defaultSpyCount = getSpyCountForPlayers(room.players.length);

  const handleSpyCountChange = (delta: number) => {
    const newCount = Math.max(1, Math.min(room.spyCount + delta, Math.floor(room.players.length / 2)));
    updateSpyCount(newCount);
  };

  const getExternalPlayerLink = () => {
    if (!room.externalPlayerToken) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/external/${room.id}/${room.externalPlayerToken}`;
  };

  const copyExternalLink = () => {
    const link = getExternalPlayerLink();
    navigator.clipboard.writeText(link);
    setCopiedExternal(true);
    toast({ title: "تم النسخ!", description: "تم نسخ الرابط بنجاح" });
    setTimeout(() => setCopiedExternal(false), 2000);
  };

  const getRoomJoinLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/join/${room.id}`;
  };

  const copyRoomLink = () => {
    const link = getRoomJoinLink();
    navigator.clipboard.writeText(link);
    setCopiedRoom(true);
    toast({ title: "تم النسخ!", description: "تم نسخ رابط الغرفة بنجاح. شاركه مع أصدقائك للانضمام!" });
    setTimeout(() => setCopiedRoom(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          غرفة الانتظار
        </h1>
        <p className="text-muted-foreground">
          في انتظار انضمام اللاعبين وتأكيد استعدادهم
        </p>
      </div>

      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">رمز الغرفة:</span>
              <span className="font-mono font-bold text-lg tracking-wider">{room.id}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={copyRoomLink}
              data-testid="button-copy-room-link"
            >
              {copiedRoom ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedRoom ? "تم النسخ" : "نسخ رابط الدعوة"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span>اللاعبون ({room.players.length}/{maxPlayers})</span>
            </div>
            <Badge
              variant={room.gameMode === "classic" ? "default" : "secondary"}
            >
              {room.gameMode === "classic" ? "الوضع الكلاسيكي" : "وضع التمويه"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {room.players.map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center justify-between gap-4 p-3 rounded-lg border ${
                player.id === currentPlayer.id
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
              data-testid={`player-card-${player.id}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{
                    backgroundColor: `hsl(${(index * 40) % 360}, 50%, 50%)`,
                    color: "white",
                  }}
                >
                  {player.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{player.name}</span>
                    {player.isHost && (
                      <Crown className="w-4 h-4 text-warning" />
                    )}
                    {player.id === currentPlayer.id && (
                      <Badge variant="outline" className="text-xs">أنت</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {player.score} نقطة
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {player.isHost ? (
                  <Badge className="bg-primary/10 text-primary border-0">القائد</Badge>
                ) : player.isReady ? (
                  <Badge variant="default" className="gap-1 bg-success text-success-foreground">
                    <Check className="w-3 h-3" />
                    مستعد
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="w-3 h-3" />
                    في الانتظار
                  </Badge>
                )}
              </div>
            </div>
          ))}

          {room.players.length < minPlayers && (
            <p className="text-center text-sm text-muted-foreground py-2">
              يحتاج {minPlayers - room.players.length} لاعبين إضافيين على الأقل للبدء
            </p>
          )}
        </CardContent>
      </Card>

      {isHost && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              إعدادات اللعبة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  data-testid="button-decrease-spy"
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
                  data-testid="button-increase-spy"
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
                  data-testid="slider-questions-per-player"
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
                  data-testid="slider-question-duration"
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
                  data-testid="slider-answer-duration"
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
                  data-testid="slider-spy-voting-duration"
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
                  data-testid="slider-spy-guess-duration"
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
                  data-testid="button-validation-system"
                >
                  <Bot className="w-4 h-4" />
                  تلقائي
                </Button>
                <Button
                  size="sm"
                  variant={room.guessValidationMode === "players" ? "default" : "outline"}
                  onClick={() => updateGuessValidationMode("players")}
                  className="gap-1"
                  data-testid="button-validation-players"
                >
                  <UsersRound className="w-4 h-4" />
                  يدوي
                </Button>
              </div>
            </div>

            {room.gameMode === "blind" && (
              <>
                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">مصدر الكلمات</p>
                      <p className="text-sm text-muted-foreground">
                        {wordSource === "system" 
                          ? "النظام: اختيار الكلمات من قاعدة البيانات" 
                          : "خارجي: شخص خارج اللعبة يحدد الكلمات"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant={wordSource === "system" ? "default" : "outline"}
                        onClick={() => updateWordSource("system")}
                        className="gap-1"
                        data-testid="button-word-source-system"
                      >
                        <Bot className="w-4 h-4" />
                        النظام
                      </Button>
                      <Button
                        size="sm"
                        variant={wordSource === "external" ? "default" : "outline"}
                        onClick={() => updateWordSource("external")}
                        className="gap-1"
                        data-testid="button-word-source-external"
                      >
                        <Eye className="w-4 h-4" />
                        خارجي
                      </Button>
                    </div>
                  </div>

                  {wordSource === "external" && room.externalPlayerToken && (
                    <div className="space-y-2 p-3 rounded-lg bg-muted">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Link className="w-4 h-4" />
                        رابط اللاعب الخارجي
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          value={getExternalPlayerLink()}
                          readOnly
                          className="text-xs"
                          data-testid="input-external-link"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={copyExternalLink}
                          data-testid="button-copy-external-link"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        شارك هذا الرابط مع شخص خارج اللعبة لتحديد الكلمات
                      </p>
                      {hasExternalWords ? (
                        <Badge variant="default" className="gap-1 bg-success text-success-foreground">
                          <Check className="w-3 h-3" />
                          تم تحديد الكلمات
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="w-3 h-3" />
                          في انتظار تحديد الكلمات
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      <div className="flex flex-col gap-4">
        {isHost ? (
          <Button
            size="lg"
            className="w-full min-h-14 text-lg gap-2"
            disabled={!canStart}
            onClick={startGame}
            data-testid="button-start-game"
          >
            <Play className="w-5 h-5" />
            بدء اللعبة
          </Button>
        ) : (
          <Button
            size="lg"
            className={`w-full min-h-14 text-lg gap-2 ${
              currentPlayer.isReady ? "bg-success hover:bg-success/90" : ""
            }`}
            onClick={toggleReady}
            data-testid="button-toggle-ready"
          >
            {currentPlayer.isReady ? (
              <>
                <Check className="w-5 h-5" />
                مستعد!
              </>
            ) : (
              <>
                <Clock className="w-5 h-5" />
                استعداد
              </>
            )}
          </Button>
        )}

        {isHost && !canStart && (
          <p className="text-center text-sm text-muted-foreground">
            {room.players.length < minPlayers
              ? `يجب أن يكون هناك ${minPlayers} لاعبين على الأقل`
              : "في انتظار استعداد جميع اللاعبين"}
          </p>
        )}

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            اللاعبون المستعدون: {readyPlayers}/{room.players.length}
          </p>
        </div>
      </div>
    </div>
  );
}