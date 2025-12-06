import { Search, Moon, Sun, Copy, Check, LogOut, Users, Eye, EyeOff, Info, MessageCircle, CheckCircle } from "lucide-react";
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
import { ChatPopover } from "./chat-popover";

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

              {room.phase === "questioning" && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      data-testid="button-players-info"
                    >
                      <Info className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="text-center">حالة أسئلة اللاعبين</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                      {room.players.map((player) => {
                        const questionsLeft = player.questionsRemaining ?? 3;
                        const isDone = player.doneWithQuestions || questionsLeft === 0;
                        return (
                          <div
                            key={player.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{player.name}</span>
                              {player.id === playerId && (
                                <Badge variant="outline" className="text-xs">أنت</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {isDone ? (
                                <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  <CheckCircle className="w-3 h-3" />
                                  انتهى
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1">
                                  <MessageCircle className="w-3 h-3" />
                                  {questionsLeft} متبقي
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {room && <ChatPopover />}

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
                <div className="text-center py-6 space-y-4">
                  {isSpy && room?.gameMode === "classic" ? (
                    <div className="space-y-2">
                      <Search className="w-12 h-12 mx-auto text-spy" />
                      <p className="text-2xl font-bold text-spy">أنت الجاسوس!</p>
                      <p className="text-xl font-medium text-foreground mt-3">
                        {room?.selectedCategory === "countries" && "دولة"}
                        {room?.selectedCategory === "fruits_vegetables" && "خضروات وفواكه"}
                        {room?.selectedCategory === "animals" && "حيوان"}
                        {room?.selectedCategory === "cars" && "سيارة"}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        حاول اكتشاف الكلمة من أسئلة اللاعبين
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-foreground">{playerWord}</p>
                      <p className="text-muted-foreground">
                        {room?.selectedCategory === "countries" && "دولة"}
                        {room?.selectedCategory === "fruits_vegetables" && "خضروات وفواكه"}
                        {room?.selectedCategory === "animals" && "حيوان"}
                        {room?.selectedCategory === "cars" && "سيارة"}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (playerWord && room?.selectedCategory) {
                            let categoryPrefix = "";
                            if (room.selectedCategory === "countries") {
                              categoryPrefix = "دولة ";
                            } else if (room.selectedCategory === "fruits_vegetables") {
                              categoryPrefix = "فاكهة ";
                            } else if (room.selectedCategory === "animals") {
                              categoryPrefix = "حيوان ";
                            } else if (room.selectedCategory === "cars") {
                              categoryPrefix = "سيارة ";
                            }
                            const searchQuery = encodeURIComponent(categoryPrefix + playerWord);
                            window.open(`https://www.google.com/search?q=${searchQuery}`, "_blank");
                          }
                        }}
                        className="gap-2 w-full"
                      >
                        <Eye className="w-4 h-4" />
                        معلومات عن الكلمة
                        <Search className="w-4 h-4" />
                      </Button>
                    </>
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