import { Search, Moon, Sun, Copy, Check, LogOut, Users, Eye, EyeOff } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTheme } from "@/lib/theme-provider";
import { useGame } from "@/lib/game-context";

export function GameHeader() {
  const { theme, toggleTheme } = useTheme();
  const { room, leaveRoom, currentPlayer, playerId } = useGame();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const [showWord, setShowWord] = useState(false);

  // Get player's word info
  const isSpy = currentPlayer?.role === "spy";
  const playerWord = currentPlayer?.word;
  const canShowWord = room && ["questioning", "spy_voting"].includes(room.phase) && playerWord;

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
          {canShowWord && (
            <Dialog open={showWord} onOpenChange={setShowWord}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  data-testid="button-show-word"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">إظهار الكلمة</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-center">كلمتك</DialogTitle>
                </DialogHeader>
                <div className="text-center py-6">
                  {isSpy && room?.gameMode === "classic" ? (
                    <div className="space-y-2">
                      <Search className="w-12 h-12 mx-auto text-spy" />
                      <p className="text-2xl font-bold text-spy">أنت الجاسوس!</p>
                      <p className="text-muted-foreground text-sm">
                        حاول اكتشاف الكلمة من أسئلة اللاعبين
                      </p>
                    </div>
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{playerWord}</p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
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
