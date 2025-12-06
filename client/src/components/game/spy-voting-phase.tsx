import { useState, useEffect, useRef } from "react";
import { Vote, Check, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useGame } from "@/lib/game-context";
import { playVoteSound, resumeAudioContext, playTimerWarningSound } from "@/lib/sounds";

const SPY_VOTING_DURATION = 30; // 30 seconds

export function SpyVotingPhase() {
  const { room, currentPlayer, playerId, voteSpy, timerRemaining } = useGame();
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);
  const playedWarning = useRef(false);
  const [votingEnded, setVotingEnded] = useState(false);

  // Always use server's timerRemaining directly - it's synced every second
  const displayTimer = timerRemaining;

  // Debug logging
  useEffect(() => {
    console.log(`SpyVotingPhase: timerRemaining=${timerRemaining}, phase=${room?.phase}`);
  }, [timerRemaining, room?.phase]);

  // Play warning sound when timer reaches 10 seconds
  useEffect(() => {
    if (displayTimer === 10 && !playedWarning.current) {
      playTimerWarningSound();
      playedWarning.current = true;
    }
    if (displayTimer > 10) {
      playedWarning.current = false;
    }
  }, [displayTimer]);

  // Mark voting as ended when timer reaches 0
  useEffect(() => {
    if (displayTimer === 0 && room?.phase === "spy_voting") {
      setVotingEnded(true);
    }
    // Reset when phase changes or timer is reset
    if (displayTimer > 0) {
      setVotingEnded(false);
    }
  }, [displayTimer, room?.phase]);

  // Reset state when entering this phase
  useEffect(() => {
    if (room?.phase === "spy_voting") {
      setVotingEnded(false);
      playedWarning.current = false;
    }
  }, [room?.phase]);


  if (!room || !currentPlayer) return null;

  const hasVoted = room.spyVotes.some((v) => v.voterId === playerId);
  const totalVotes = room.spyVotes.length;
  const totalPlayers = room.players.length;

  // Check if voting is still allowed (timer > 0 and not ended)
  const canVote = !hasVoted && !votingEnded && displayTimer > 0;

  const voteCounts = room.players.reduce((acc, player) => {
    acc[player.id] = room.spyVotes.filter((v) => v.suspectId === player.id).length;
    return acc;
  }, {} as Record<string, number>);

  const handleVote = () => {
    if (selectedSuspect && canVote) {
      resumeAudioContext();
      playVoteSound();
      voteSpy(selectedSuspect);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          من هو الجاسوس؟
        </h1>
        <p className="text-muted-foreground">
          صوّت لتحديد من تعتقد أنه الجاسوس
        </p>
        <Badge variant="outline" className="mt-2">
          {totalVotes}/{totalPlayers} صوتوا
        </Badge>

        {/* Timer display - always show during voting phase */}
        <div className="mt-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className={`w-5 h-5 ${displayTimer <= 10 ? 'text-destructive animate-pulse' : 'text-primary'}`} />
            <span className={`text-xl font-bold tabular-nums ${displayTimer <= 10 ? 'text-destructive' : ''}`}>
              {Math.floor(displayTimer / 60)}:{(displayTimer % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <Progress value={(displayTimer / SPY_VOTING_DURATION) * 100} className="h-2 w-48 mx-auto" />
          {votingEnded && !hasVoted && (
            <p className="text-destructive text-sm mt-2 animate-pulse">انتهى وقت التصويت</p>
          )}
        </div>


      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Vote className="w-5 h-5 text-primary" />
            اختر المشتبه به
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {room.players.map((player, index) => {
            const votes = voteCounts[player.id];
            const percentage = totalPlayers > 0 ? (votes / totalPlayers) * 100 : 0;
            const isSelected = selectedSuspect === player.id;
            const isMe = player.id === playerId;

            return (
              <div
                key={player.id}
                className={`p-4 rounded-lg border transition-all ${
                  isSelected
                    ? "border-spy ring-2 ring-spy/20 bg-spy/5"
                    : "border-border hover-elevate"
                } ${!canVote || isMe ? "opacity-60 pointer-events-none" : "cursor-pointer"}`}
                onClick={() => canVote && !isMe && setSelectedSuspect(player.id)}
                data-testid={`vote-player-${player.id}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback
                        className="text-lg font-bold"
                        style={{
                          backgroundColor: `hsl(${(index * 40) % 360}, 50%, 50%)`,
                          color: "white",
                        }}
                      >
                        {player.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {player.name}
                        {isMe && <Badge variant="outline" className="text-xs">لا يمكنك التصويت لنفسك</Badge>}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {votes} {votes === 1 ? "صوت" : "أصوات"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSelected && canVote && (
                      <Check className="w-5 h-5 text-spy" />
                    )}
                  </div>
                </div>
                {hasVoted && (
                  <div className="mt-3">
                    <Progress value={percentage} className="h-2" />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {canVote && (
        <Button
          size="lg"
          className="w-full min-h-14 text-lg gap-2 bg-spy hover:bg-spy/90"
          disabled={!selectedSuspect || votingEnded}
          onClick={handleVote}
          data-testid="button-submit-vote"
        >
          <Vote className="w-5 h-5" />
          تأكيد التصويت
        </Button>
      )}

      {hasVoted && (
        <div className="text-center">
          <p className="text-muted-foreground animate-pulse">
            في انتظار تصويت باقي اللاعبين...
          </p>
        </div>
      )}

      {votingEnded && !hasVoted && (
        <div className="text-center">
          <p className="text-destructive">
            انتهى وقت التصويت - لم تحصل على نقطة
          </p>
        </div>
      )}
    </div>
  );
}