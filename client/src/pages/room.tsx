import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useGame } from "@/lib/game-context";
import { LobbyPhase } from "@/components/game/lobby-phase";
import { CategoryVotingPhase } from "@/components/game/category-voting-phase";
import { WordRevealPhase } from "@/components/game/word-reveal-phase";
import { QuestioningPhase } from "@/components/game/questioning-phase";
import { SpyVotingPhase } from "@/components/game/spy-voting-phase";
import { SpyGuessPhase } from "@/components/game/spy-guess-phase";
import { GuessValidationPhase } from "@/components/game/guess-validation-phase";
import { ResultsPhase } from "@/components/game/results-phase";
import { GameHeader } from "@/components/game/game-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const [, setLocation] = useLocation();
  const { room, playerId, isConnected } = useGame();

  useEffect(() => {
    if (!room && isConnected) {
      setLocation("/");
    }
  }, [room, isConnected, setLocation]);

  if (!room || !playerId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  const renderPhase = () => {
    switch (room.phase) {
      case "lobby":
        return <LobbyPhase />;
      case "category_voting":
        return <CategoryVotingPhase />;
      case "word_reveal":
        return <WordRevealPhase />;
      case "questioning":
        return <QuestioningPhase />;
      case "spy_voting":
        return <SpyVotingPhase />;
      case "spy_guess":
        return <SpyGuessPhase />;
      case "guess_validation":
        return <GuessValidationPhase />;
      case "results":
        return <ResultsPhase />;
      default:
        return <LobbyPhase />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GameHeader />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-4 overflow-auto">
          <div className="max-w-4xl mx-auto animate-fade-in">
            {renderPhase()}
          </div>
        </main>
      </div>
    </div>
  );
}
