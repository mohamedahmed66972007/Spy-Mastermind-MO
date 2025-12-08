import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useGame } from "@/lib/game-context";
import { z } from "zod";

const PLAYER_NAME_KEY = "spy_game_player_name";

const joinSchema = z.object({
  playerName: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(20, "الاسم طويل جداً"),
});

type JoinInput = z.infer<typeof joinSchema>;

export default function Join() {
  const { roomId } = useParams<{ roomId: string }>();
  const { joinRoom, isConnected, error, room } = useGame();
  const [, setLocation] = useLocation();
  const [isJoining, setIsJoining] = useState(false);

  const savedName = typeof window !== "undefined" ? localStorage.getItem(PLAYER_NAME_KEY) || "" : "";

  const form = useForm<JoinInput>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      playerName: savedName,
    },
  });

  const handleJoin = (data: JoinInput) => {
    if (!roomId) return;
    const trimmedName = data.playerName.trim();
    const normalizedRoomCode = roomId.trim().toUpperCase();
    localStorage.setItem(PLAYER_NAME_KEY, trimmedName);
    setIsJoining(true);
    joinRoom(trimmedName, normalizedRoomCode);
  };

  useEffect(() => {
    if (room) {
      setLocation(`/room/${room.id}`);
    }
  }, [room, setLocation]);

  if (room) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Search className="w-16 h-16 text-primary" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-spy rounded-full flex items-center justify-center">
                <span className="text-spy-foreground text-xs font-bold">؟</span>
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl">الانضمام للغرفة</CardTitle>
          <p className="text-muted-foreground mt-2">
            أنت مدعو للانضمام لغرفة <span className="font-mono font-bold">{roomId}</span>
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleJoin)} className="space-y-6">
              <FormField
                control={form.control}
                name="playerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسمك</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="أدخل اسمك..."
                        data-testid="input-player-name-join-link"
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button 
                type="submit" 
                className="w-full min-h-12 gap-2" 
                disabled={!isConnected || isJoining}
                data-testid="button-submit-join-link"
              >
                <UserPlus className="w-5 h-5" />
                {isJoining ? "جاري الانضمام..." : "انضمام للغرفة"}
              </Button>
              {!isConnected && (
                <p className="text-center text-sm text-muted-foreground animate-pulse">
                  جاري الاتصال بالخادم...
                </p>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
