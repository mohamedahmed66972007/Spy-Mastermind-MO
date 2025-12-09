[x] 1. Install the required packages
[x] 2. Restart the workflow to see if the project is working
[x] 3. Verify the project is working using the feedback tool
[x] 4. Inform user the import is completed and they can start building, mark the import as completed using the complete_project_import tool
[x] 5. Fix turn system - auto-advance turn after answer is given (one question per turn)
[x] 6. Fix timer reset when turn changes
[x] 7. Add number guessing game button to home page
[x] 8. Randomize turn order for each new game round
[x] 9. Add PWA manifest and service worker for app installation
[x] 10. Add install button to home page header
[x] 11. Save player name to localStorage and auto-fill in forms
[x] 12. Migration complete - all dependencies installed and workflow running successfully
[x] 13. Final verification - npm install completed, workflow restarted, app verified working with screenshot
[x] 14. Final migration verification - Dec 6, 2024 - All packages installed, workflow running, app fully functional
[x] 15. Re-migration verification - Dec 6, 2024 - npm install completed, workflow restarted successfully, app fully functional with screenshot verification
[x] 16. Fixed spy voting timer issue - Dec 6, 2024 - Added missing startSpyVotingTimer() calls to done_with_questions and end_turn handlers
[x] 17. Fixed duplicate scoring issue - Dec 6, 2024 - Removed duplicate point awarding in processGuessValidation and processSystemGuessValidation. Now points for voting correctly on spy are only awarded once in processSpyVotes
[x] 18. Re-migration completion - Dec 8, 2024 - npm install completed successfully, workflow restarted and running, app fully functional with screenshot verification showing homepage with Arabic text
[x] 19. Fixed timer frozen at 85 issue - Dec 8, 2024 - Client now uses room.gameSettings.questionDuration instead of hardcoded 60 seconds
[x] 20. Improved spelling correction - Dec 8, 2024 - Made more lenient for Arabic words, allowing more typos based on word length
[x] 21. Fixed word distribution in camouflage mode - Dec 8, 2024 - Improved getSimilarWord to ensure fruits pair with fruits, vegetables with vegetables, countries from same region, and cars from same brand
[x] 22. Fixed custom question count - Dec 8, 2024 - Now uses room.gameSettings.questionsPerPlayer instead of hardcoded QUESTIONS_PER_PLAYER=3
[x] 23. Fixed progress bar - Dec 8, 2024 - Now uses actual questionDuration/answerDuration from room settings instead of hardcoded 60/30 seconds
[x] 24. Re-migration completion - Dec 9, 2024 - npm install completed successfully, workflow restarted and running, app fully functional with screenshot verification
