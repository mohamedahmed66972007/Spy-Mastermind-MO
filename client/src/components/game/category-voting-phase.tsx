import { useState, useEffect, useRef } from "react";
import { Globe, Apple, Dog, Car, Check, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useGame } from "@/lib/game-context";
import { categories } from "@shared/schema";
import { playTimerWarningSound } from "@/lib/sounds";

const categoryIcons: Record<string, typeof Globe> = {
  globe: Globe,
  apple: Apple,
  dog: Dog,
  car: Car,
};

export function CategoryVotingPhase() {
  const { room, currentPlayer, voteCategory, timerRemaining } = useGame();
  const [localTimer, setLocalTimer] = useState(timerRemaining || 30);
  const playedWarning = useRef(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with server timer
  useEffect(() => {
    if (timerRemaining > 0) {
      setLocalTimer(timerRemaining);
      if (timerRemaining > 10) {
        playedWarning.current = false;
      }
    }
  }, [timerRemaining]);

  // Local countdown
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (room?.phase !== "category_voting") return;

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

  const playerVote = room.categoryVotes.find((v) => v.playerId === currentPlayer.id);
  const hasVoted = !!playerVote;

  const voteCounts = categories.reduce((acc, cat) => {
    acc[cat.id] = room.categoryVotes.filter((v) => v.category === cat.id).length;
    return acc;
  }, {} as Record<string, number>);

  const totalVotes = room.categoryVotes.length;
  const totalPlayers = room.players.length;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          اختر التصنيف
        </h1>
        <p className="text-muted-foreground">
          صوّت على التصنيف الذي تريد اللعب به
        </p>
        <Badge variant="outline" className="mt-2">
          {totalVotes}/{totalPlayers} صوتوا
        </Badge>
        
        {/* Timer display */}
        {localTimer > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-xl font-bold tabular-nums">
                {Math.floor(localTimer / 60)}:{(localTimer % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <Progress value={(localTimer / 30) * 100} className="h-2 w-48 mx-auto" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map((category) => {
          const Icon = categoryIcons[category.icon] || Globe;
          const votes = voteCounts[category.id];
          const isSelected = playerVote?.category === category.id;
          const percentage = totalPlayers > 0 ? (votes / totalPlayers) * 100 : 0;

          return (
            <Card
              key={category.id}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "border-primary ring-2 ring-primary/20"
                  : "hover-elevate"
              } ${hasVoted && !isSelected ? "opacity-60" : ""}`}
              onClick={() => !hasVoted && voteCategory(category.id)}
              data-testid={`category-card-${category.id}`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold flex items-center justify-center gap-2">
                      {category.name}
                      {isSelected && <Check className="w-5 h-5 text-primary" />}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {votes} {votes === 1 ? "صوت" : "أصوات"}
                    </p>
                  </div>
                  <div className="w-full">
                    <Progress value={percentage} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {hasVoted && (
        <div className="text-center">
          <p className="text-muted-foreground animate-pulse">
            في انتظار تصويت باقي اللاعبين...
          </p>
        </div>
      )}
    </div>
  );
}
