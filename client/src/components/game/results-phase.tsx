import { Trophy, Medal, Star, RotateCcw, Crown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useGame } from "@/lib/game-context";

export function ResultsPhase() {
  const { room, currentPlayer, isHost, nextRound, playerId } = useGame();

  if (!room || !currentPlayer) return null;

  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);

  const spies = room.players.filter((p) => room.revealedSpyIds.includes(p.id));

  const spyWon = room.guessValidationVotes.filter((v) => v.isCorrect).length >
    room.guessValidationVotes.filter((v) => !v.isCorrect).length;

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
            {spies.map((spy) => (
              <div
                key={spy.id}
                className="flex items-center gap-2 p-2 bg-spy/10 rounded-lg border border-spy/20"
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
              "bg-gradient-to-l from-yellow-100 to-yellow-50 border-yellow-300",
              "bg-gradient-to-l from-gray-100 to-gray-50 border-gray-300",
              "bg-gradient-to-l from-orange-100 to-orange-50 border-orange-300",
            ];
            const textColors = ["text-yellow-700", "text-gray-600", "text-orange-600"];
            
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
                    {room.revealedSpyIds.includes(player.id) && (
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
        <Button
          size="lg"
          className="w-full min-h-14 text-lg gap-2"
          onClick={nextRound}
          data-testid="button-next-round"
        >
          <RotateCcw className="w-5 h-5" />
          الجولة التالية
        </Button>
      )}

      {!isHost && (
        <p className="text-center text-muted-foreground">
          في انتظار القائد لبدء الجولة التالية...
        </p>
      )}
    </div>
  );
}
