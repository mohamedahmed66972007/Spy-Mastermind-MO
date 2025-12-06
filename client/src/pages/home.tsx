import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Users, Moon, Sun, Play, UserPlus, Hash, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useTheme } from "@/lib/theme-provider";
import { useGame } from "@/lib/game-context";
import { createRoomSchema, joinRoomSchema, type CreateRoomInput, type JoinRoomInput, type GameMode } from "@shared/schema";

const PLAYER_NAME_KEY = "spy_game_player_name";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { createRoom, joinRoom, isConnected, error, clearError, room } = useGame();
  const [, setLocation] = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const savedName = typeof window !== "undefined" ? localStorage.getItem(PLAYER_NAME_KEY) || "" : "";

  const createForm = useForm<CreateRoomInput>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      playerName: savedName,
      gameMode: "classic",
    },
  });

  const joinForm = useForm<JoinRoomInput>({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: {
      playerName: savedName,
      roomCode: "",
    },
  });

  const handleCreateRoom = (data: CreateRoomInput) => {
    localStorage.setItem(PLAYER_NAME_KEY, data.playerName);
    createRoom(data.playerName, data.gameMode);
  };

  const handleJoinRoom = (data: JoinRoomInput) => {
    localStorage.setItem(PLAYER_NAME_KEY, data.playerName);
    joinRoom(data.playerName, data.roomCode.toUpperCase());
  };

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  };

  useEffect(() => {
    const checkInstalled = () => {
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
      }
    };
    checkInstalled();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (room) {
      setLocation(`/room/${room.id}`);
    }
  }, [room, setLocation]);

  if (room) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full p-4 flex justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Search className="w-6 h-6 text-primary" />
          <span className="text-lg font-bold text-foreground">من هو الجاسوس؟</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isInstalled && (
            <Button
              variant="default"
              size="sm"
              className="gap-2"
              onClick={installPrompt ? handleInstallClick : () => {
                alert("لتحميل التطبيق:\n1. افتح الموقع في متصفح Chrome أو Edge\n2. اضغط على القائمة (النقاط الثلاث)\n3. اختر 'إضافة إلى الشاشة الرئيسية' أو 'تثبيت التطبيق'");
              }}
              data-testid="button-install-app"
            >
              <Download className="w-4 h-4" />
              تحميل التطبيق
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.open("https://game-mo2025-v3.onrender.com", "_blank")}
            data-testid="button-number-game"
          >
            <Hash className="w-4 h-4" />
            لعبة تخمين الأرقام
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-8">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="relative inline-block">
            <Search className="w-20 h-20 md:w-28 md:h-28 text-primary mx-auto" />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-spy rounded-full flex items-center justify-center">
              <span className="text-spy-foreground text-xs font-bold">؟</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            من هو الجاسوس؟
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md animate-fade-in">
          <Button
            size="lg"
            className="flex-1 min-h-14 text-lg gap-2"
            onClick={() => setShowCreateModal(true)}
            disabled={!isConnected}
            data-testid="button-create-room"
          >
            <Play className="w-5 h-5" />
            إنشاء غرفة
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="flex-1 min-h-14 text-lg gap-2"
            onClick={() => setShowJoinModal(true)}
            disabled={!isConnected}
            data-testid="button-join-room"
          >
            <UserPlus className="w-5 h-5" />
            انضمام لغرفة
          </Button>
        </div>

        {!isConnected && (
          <p className="text-muted-foreground text-sm animate-pulse">
            جاري الاتصال بالخادم...
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-2xl w-full">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">4-10 لاعبين</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-8 h-8 mx-auto mb-2 bg-spy rounded-full flex items-center justify-center">
                <span className="text-spy-foreground font-bold">؟</span>
              </div>
              <p className="text-sm text-muted-foreground">اكتشف الجاسوس</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-8 h-8 mx-auto mb-2 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">30</span>
              </div>
              <p className="text-sm text-muted-foreground">30 ثانية للتصويت</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-8 h-8 mx-auto mb-2 bg-accent rounded-full flex items-center justify-center">
                <span className="text-accent-foreground font-bold">3</span>
              </div>
              <p className="text-sm text-muted-foreground">أسئلة لكل لاعب</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">إنشاء غرفة جديدة</DialogTitle>
            <DialogDescription>
              أدخل اسمك واختر وضع اللعب لإنشاء غرفة جديدة
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateRoom)} className="space-y-6">
              <FormField
                control={createForm.control}
                name="playerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسمك</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="أدخل اسمك..."
                        data-testid="input-player-name-create"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="gameMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وضع اللعب</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 gap-4"
                      >
                        <Label
                          htmlFor="classic"
                          className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover-elevate [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                        >
                          <RadioGroupItem value="classic" id="classic" data-testid="radio-classic" />
                          <div className="flex-1">
                            <p className="font-medium">الوضع الكلاسيكي</p>
                            <p className="text-sm text-muted-foreground">
                              الجاسوس يعرف أنه جاسوس ويرى "أنت الجاسوس"
                            </p>
                          </div>
                        </Label>
                        <Label
                          htmlFor="blind"
                          className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover-elevate [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                        >
                          <RadioGroupItem value="blind" id="blind" data-testid="radio-blind" />
                          <div className="flex-1">
                            <p className="font-medium">وضع التمويه</p>
                            <p className="text-sm text-muted-foreground">
                              الجاسوس لا يعرف أنه جاسوس ويرى كلمة مختلفة
                            </p>
                          </div>
                        </Label>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full min-h-12" data-testid="button-submit-create">
                إنشاء الغرفة
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">الانضمام لغرفة</DialogTitle>
            <DialogDescription>
              أدخل اسمك ورمز الغرفة للانضمام
            </DialogDescription>
          </DialogHeader>
          <Form {...joinForm}>
            <form onSubmit={joinForm.handleSubmit(handleJoinRoom)} className="space-y-6">
              <FormField
                control={joinForm.control}
                name="playerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسمك</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="أدخل اسمك..."
                        data-testid="input-player-name-join"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={joinForm.control}
                name="roomCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رمز الغرفة</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="أدخل رمز الغرفة (6 أحرف)"
                        className="text-center tracking-widest text-lg uppercase"
                        maxLength={6}
                        data-testid="input-room-code"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full min-h-12" data-testid="button-submit-join">
                انضمام للغرفة
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
