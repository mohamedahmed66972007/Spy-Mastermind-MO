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
  const topThree = sortedPlayers.slice(0, 3);
  const rest = sortedPlayers.slice(3);

  const spies = room.players.filter((p) => room.revealedSpyIds.includes(p.id));
  const regularPlayers = room.players.filter(
    (p) => !room.revealedSpyIds.includes(p.id)
  );

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
        <CardContent className="space-y-4">
          <div className="flex justify-center items-end gap-4 py-4">
            {topThree.map((player, index) => {
              const positions = [1, 0, 2];
              const displayIndex = positions[index];
              const heights = ["h-24", "h-32", "h-20"];
              const bgColors = [
                "bg-gradient-to-b from-amber-400 to-amber-500",
                "bg-gradient-to-b from-yellow-300 to-yellow-400",
                "bg-gradient-to-b from-orange-300 to-orange-400",
              ];
              const icons = [
                <Medal key="1" className="w-6 h-6" />,
                <Crown key="0" className="w-8 h-8" />,
                <Star key="2" className="w-5 h-5" />,
              ];

              return (
                <div
                  key={player.id}
                  className="flex flex-col items-center animate-count-up"
                  style={{
                    order: displayIndex,
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  <Avatar className="w-12 h-12 mb-2 border-2 border-background shadow-lg">
                    <AvatarFallback
                      className="text-lg font-bold"
                      style={{
                        backgroundColor: `hsl(${(sortedPlayers.indexOf(player) * 40) % 360}, 50%, 50%)`,
                        color: "white",
                      }}
                    >
                      {player.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-sm mb-1 text-center truncate max-w-[80px]">
                    {player.name}
                  </p>
                  <div
                    className={`${heights[index]} w-16 ${bgColors[index]} rounded-t-lg flex flex-col items-center justify-start pt-2 text-white shadow-lg`}
                  >
                    {icons[index]}
                    <span className="font-bold text-lg mt-1">{player.score}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {rest.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                {rest.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center text-muted-foreground font-medium">
                        {index + 4}
                      </span>
                      <Avatar className="w-8 h-8">
                        <AvatarFallback
                          className="text-sm"
                          style={{
                            backgroundColor: `hsl(${(sortedPlayers.indexOf(player) * 40) % 360}, 50%, 50%)`,
                            color: "white",
                          }}
                        >
                          {player.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{player.name}</span>
                      {player.id === playerId && (
                        <Badge variant="outline" className="text-xs">أنت</Badge>
                      )}
                    </div>
                    <span className="font-bold">{player.score} نقطة</span>
                  </div>
                ))}
              </div>
            </>
          )}
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
