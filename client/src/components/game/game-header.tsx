import { Search, Moon, Sun, Copy, Check, LogOut, Users } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTheme } from "@/lib/theme-provider";
import { useGame } from "@/lib/game-context";

export function GameHeader() {
  const { theme, toggleTheme } = useTheme();
  const { room, leaveRoom, timerRemaining } = useGame();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);

  const copyRoomCode = async () => {
    if (room) {
      await navigator.clipboard.writeText(room.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeave = () => {
    leaveRoom();
    setLocation("/");
  };

  const phaseNames: Record<string, string> = {
    lobby: "غرفة الانتظار",
    category_voting: "اختيار التصنيف",
    word_reveal: "كشف الكلمة",
    questioning: "جولة الأسئلة",
    spy_voting: "التصويت",
    spy_guess: "تخمين الجاسوس",
    guess_validation: "التحقق من الإجابة",
    results: "النتائج",
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between gap-2 p-3 md:p-4">
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            <span className="text-sm md:text-base font-bold text-foreground hidden sm:inline">
              من هو الجاسوس؟
            </span>
          </div>

          {room && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={copyRoomCode}
                className="gap-2 font-mono"
                data-testid="button-copy-room-code"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="tracking-wider">{room.id}</span>
              </Button>

              <Badge variant="secondary" className="gap-1">
                <Users className="w-3 h-3" />
                {room.players.length}
              </Badge>

              {room.phase !== "lobby" && (
                <Badge variant="outline">
                  {phaseNames[room.phase] || room.phase}
                </Badge>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {timerRemaining > 0 && room?.phase !== "lobby" && (
            <div
              className={`flex items-center justify-center min-w-[60px] h-9 px-3 rounded-lg font-bold text-lg ${
                timerRemaining <= 10
                  ? "bg-destructive text-destructive-foreground animate-timer-pulse"
                  : timerRemaining <= 30
                  ? "bg-warning text-warning-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
              data-testid="text-timer"
            >
              {timerRemaining}
            </div>
          )}

          <Button
            size="icon"
            variant="ghost"
            onClick={toggleTheme}
            data-testid="button-theme-toggle-room"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost" data-testid="button-leave-room">
                <LogOut className="w-5 h-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>مغادرة الغرفة</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من مغادرة الغرفة؟ ستفقد تقدمك في اللعبة الحالية.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleLeave} data-testid="button-confirm-leave">
                  مغادرة
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </header>
  );
}
