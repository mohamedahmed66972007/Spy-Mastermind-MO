import { useState } from "react";
import { Eye, EyeOff, Info, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGame } from "@/lib/game-context";

export function WordRevealPhase() {
  const { room, currentPlayer } = useGame();
  const [isRevealed, setIsRevealed] = useState(false);

  if (!room || !currentPlayer) return null;

  const isSpy = currentPlayer.role === "spy";
  const word = currentPlayer.word || "";

  const handleInfoClick = () => {
    if (word && !isSpy && room?.selectedCategory) {
      let categoryPrefix = "";
      if (room.selectedCategory === "countries") {
        categoryPrefix = "دولة ";
      } else if (room.selectedCategory === "fruits_vegetables") {
        categoryPrefix = "ثمرة ";
      } else if (room.selectedCategory === "animals") {
        categoryPrefix = "حيوان ";
      } else if (room.selectedCategory === "cars") {
        categoryPrefix = "سيارة ";
      }
      const searchQuery = encodeURIComponent(categoryPrefix + word);
      window.open(`https://www.google.com/search?q=${searchQuery}`, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          كشف الكلمة
        </h1>
        <p className="text-muted-foreground">
          اضغط على البطاقة لرؤية كلمتك - لا تدع أحداً يراها!
        </p>
      </div>

      <div className="flex justify-center">
        <Card
          className={`w-full max-w-sm cursor-pointer transition-all duration-300 ${
            isRevealed
              ? isSpy && room.gameMode === "classic"
                ? "bg-spy/10 border-spy"
                : "bg-primary/10 border-primary"
              : "bg-muted"
          }`}
          onClick={() => setIsRevealed(!isRevealed)}
          data-testid="card-word-reveal"
        >
          <CardContent className="p-8 min-h-[200px] flex flex-col items-center justify-center relative">
            {isRevealed ? (
              <div className="text-center space-y-4 animate-scale-in">
                {isSpy && room.gameMode === "classic" ? (
                  <>
                    <Search className="w-16 h-16 mx-auto text-spy" />
                    <p className="text-3xl font-bold text-spy">
                      أنت الجاسوس!
                    </p>
                    <p className="text-2xl font-medium text-foreground mt-4">
                      {room.selectedCategory === "countries" && "دولة"}
                      {room.selectedCategory === "fruits_vegetables" && "خضروات وفواكه"}
                      {room.selectedCategory === "animals" && "حيوان"}
                      {room.selectedCategory === "cars" && "سيارة"}
                    </p>
                    <p className="text-muted-foreground">
                      حاول اكتشاف الكلمة من أسئلة اللاعبين
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-4xl font-bold text-foreground">
                      {word}
                    </p>
                    <p className="text-muted-foreground">
                      {room.selectedCategory === "countries" && "دولة"}
                      {room.selectedCategory === "fruits_vegetables" && "خضروات وفواكه"}
                      {room.selectedCategory === "animals" && "حيوان"}
                      {room.selectedCategory === "cars" && "سيارة"}
                      {room.externalWords && room.externalWords.category && (
                        <span>{room.externalWords.category}</span>
                      )}
                    </p>
                  </>
                )}
                <EyeOff className="w-6 h-6 mx-auto text-muted-foreground mt-4" />
                <p className="text-xs text-muted-foreground">اضغط للإخفاء</p>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-muted-foreground/20 flex items-center justify-center mx-auto">
                  <Eye className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-lg text-muted-foreground">
                  اضغط لكشف كلمتك
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isRevealed && !isSpy && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleInfoClick}
            className="gap-2"
            data-testid="button-word-info"
          >
            <Info className="w-4 h-4" />
            معلومات عن الكلمة
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="text-center text-sm text-muted-foreground">
        <p>
          سيبدأ الدور الأول قريباً - جهّز أسئلتك!
        </p>
      </div>
    </div>
  );
}
