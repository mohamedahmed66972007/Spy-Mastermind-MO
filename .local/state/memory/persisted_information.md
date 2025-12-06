# Persisted Information - Spy Voting Timer Complete

## Completed Tasks (All Done)

All spy voting timer tasks have been completed and architect-reviewed:

1. **Fix spy voting timer** - Timer set to 30 seconds (SPY_VOTING_DURATION)
2. **Fix timer sync on refresh** - Added computeTimerRemaining() helper and timer_update on reconnect
3. **Fix voting end behavior** - forceEndSpyVoting properly triggers phase transition and awards points
4. **Block votes after timer ends** - voteSpy returns undefined after timeout
5. **Update home page** - Changed display from 60 to 30 seconds

## Key Changes Made

### server/routes.ts
- Added `computeTimerRemaining(room)` helper function (lines 73-91)
- Uses SPY_VOTING_DURATION_MS, SPY_GUESS_DURATION_MS, CATEGORY_VOTING_DURATION_MS constants
- Updated reconnect handler to send timer_update after reconnection (lines 581-589)

### server/game-storage.ts
- Fixed `voteSpy` to return `undefined` when time expires (line 562)
- This prevents late votes and signals rejection to upstream code

### client/src/components/game/spy-voting-phase.tsx
- Uses server's timerRemaining directly for display
- Tracks votingEnded state when timer reaches 0
- canVote computed as: !hasVoted && !votingEnded && displayTimer > 0

### client/src/pages/home.tsx
- Updated display text from 60 to 30 seconds

## Application State
- All tasks completed and architect-reviewed
- Workflow running successfully
- Ready for user testing
