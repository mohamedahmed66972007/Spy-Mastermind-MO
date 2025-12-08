

import { useEffect, useState } from "react";
import { Clock, Vote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useGame } from "@/lib/game-context";

const TRANSITION_DURATION = 10; // 10 seconds

export function PreVotingTransition() {
  const { room, timerRemaining } = useGame();
  const [displayTimer, setDisplayTimer] = useState(TRANSITION_DURATION);

  // Update display timer whenever server timer changes
  useEffect(() => {
    if (room?.phase === "pre_voting_transition") {
      console.log(`PreVotingTransition: Server timer update: ${timerRemaining}s`);
      setDisplayTimer(timerRemaining);
    }
  }, [timerRemaining, room?.phase]);

  if (!room) return null;

  const lastQuestion = room.questions && room.questions.length > 0 
    ? room.questions[room.questions.length - 1] 
    : null;
  const asker = lastQuestion ? room.players.find((p) => p.id === lastQuestion.askerId) : null;
  const target = lastQuestion ? room.players.find((p) => p.id === lastQuestion.targetId) : null;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground animate-fade-in">
          انتهت مرحلة الأسئلة
        </h1>
        <p className="text-muted-foreground">
          جاري الانتقال إلى مرحلة التصويت...
        </p>

        <div className="mt-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Vote className="w-6 h-6 text-primary animate-pulse" />
            <span className="text-3xl font-bold tabular-nums text-primary">
              {displayTimer}
            </span>
          </div>
          <Progress 
            value={(displayTimer / TRANSITION_DURATION) * 100} 
            className="h-3 w-64 mx-auto"
          />
        </div>
      </div>

      {lastQuestion && (
        <Card className="border-primary/50 shadow-lg">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-3 text-center">
              آخر سؤال:
            </p>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">
                  <span className="font-medium">{asker?.name}</span> سأل{" "}
                  <span className="font-medium">{target?.name}</span>:
                </p>
                <p className="font-medium mt-2">{lastQuestion.question}</p>
              </div>
              {lastQuestion.answer && (
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-sm text-muted-foreground mb-1">
                    <span className="font-medium">{target?.name}</span> أجاب:
                  </p>
                  <p className="font-medium mt-2">{lastQuestion.answer}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-muted-foreground animate-pulse">
          <Clock className="w-5 h-5" />
          <p>استعد للتصويت على من تعتقد أنه الجاسوس</p>
        </div>
      </div>
    </div>
  );
}

