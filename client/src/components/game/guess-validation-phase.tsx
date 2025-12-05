import { ThumbsUp, ThumbsDown, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useGame } from "@/lib/game-context";

export function GuessValidationPhase() {
  const { room, currentPlayer, playerId, validateGuess } = useGame();

  if (!room || !currentPlayer) return null;

  const hasVoted = room.guessValidationVotes.some((v) => v.playerId === playerId);
  const isSpy = room.revealedSpyIds.includes(playerId || "");
  const totalVotes = room.guessValidationVotes.length;
  const nonSpyPlayers = room.players.filter(
    (p) => !room.revealedSpyIds.includes(p.id)
  );
  const totalVoters = nonSpyPlayers.length;

  const correctVotes = room.guessValidationVotes.filter((v) => v.isCorrect).length;
  const incorrectVotes = room.guessValidationVotes.filter((v) => !v.isCorrect).length;

  const correctPercentage = totalVotes > 0 ? (correctVotes / totalVotes) * 100 : 0;
  const incorrectPercentage = totalVotes > 0 ? (incorrectVotes / totalVotes) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          هل الإجابة صحيحة؟
        </h1>
        <p className="text-muted-foreground">
          صوّت لتحديد ما إذا كان تخمين الجاسوس صحيحاً
        </p>
        <Badge variant="outline" className="mt-2">
          {totalVotes}/{totalVoters} صوتوا
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-center">تخمين الجاسوس</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-3xl font-bold text-foreground mb-4">
            "{room.spyGuess}"
          </p>
          <p className="text-muted-foreground">
            الكلمة الأصلية: <span className="font-bold text-primary">{room.currentWord}</span>
          </p>
        </CardContent>
      </Card>

      {isSpy ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg text-muted-foreground">
              أنت الجاسوس - لا يمكنك التصويت
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              في انتظار تصويت اللاعبين الآخرين...
            </p>
          </CardContent>
        </Card>
      ) : hasVoted ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>صحيح</span>
                </div>
                <span className="font-bold">{correctVotes}</span>
              </div>
              <Progress value={correctPercentage} className="h-2 bg-muted" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <X className="w-5 h-5 text-destructive" />
                  <span>خاطئ</span>
                </div>
                <span className="font-bold">{incorrectVotes}</span>
              </div>
              <Progress value={incorrectPercentage} className="h-2 bg-muted" />
            </div>
            <p className="text-center text-muted-foreground animate-pulse mt-4">
              في انتظار تصويت باقي اللاعبين...
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Button
            size="lg"
            className="min-h-20 text-lg gap-2 bg-success hover:bg-success/90"
            onClick={() => validateGuess(true)}
            data-testid="button-vote-correct"
          >
            <ThumbsUp className="w-6 h-6" />
            صحيح
          </Button>
          <Button
            size="lg"
            variant="destructive"
            className="min-h-20 text-lg gap-2"
            onClick={() => validateGuess(false)}
            data-testid="button-vote-incorrect"
          >
            <ThumbsDown className="w-6 h-6" />
            خاطئ
          </Button>
        </div>
      )}
    </div>
  );
}
