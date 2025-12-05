import { Crown, Check, Clock, Play, Settings, Users, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useGame } from "@/lib/game-context";
import { getMinPlayersForStart, getMaxPlayers, getSpyCountForPlayers } from "@shared/schema";

export function LobbyPhase() {
  const { room, currentPlayer, isHost, toggleReady, startGame, updateSpyCount } = useGame();

  if (!room || !currentPlayer) return null;

  const minPlayers = getMinPlayersForStart();
  const maxPlayers = getMaxPlayers();
  const readyPlayers = room.players.filter((p) => p.isReady || p.isHost).length;
  const allReady = room.players.every((p) => p.isReady || p.isHost);
  const canStart = room.players.length >= minPlayers && allReady;
  const defaultSpyCount = getSpyCountForPlayers(room.players.length);

  const handleSpyCountChange = (delta: number) => {
    const newCount = Math.max(1, Math.min(room.spyCount + delta, Math.floor(room.players.length / 2)));
    updateSpyCount(newCount);
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
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span>اللاعبون ({room.players.length}/{maxPlayers})</span>
            </div>
            <Badge
              variant={room.gameMode === "classic" ? "default" : "secondary"}
            >
              {room.gameMode === "classic" ? "الوضع الكلاسيكي" : "الوضع الأعمى"}
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
          <CardContent>
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
