# Overview

"من هو الجاسوس؟" (Who is the Spy?) is a real-time multiplayer social deduction game built for Arabic-speaking audiences. Players join private rooms (4-10 players) where they're divided into regular players who know the secret word and spies who receive different words. Through questioning rounds, players attempt to identify spies while spies try to blend in and guess the real word.

The application supports two game modes: Classic (spies know their word differs) and Blind (spies don't know they're spies). The game features category voting, turn-based questioning, spy voting, and guess validation mechanics with a scoring system across multiple rounds.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 18 with TypeScript using Vite as the build tool

**UI Component System**: shadcn/ui with Radix UI primitives, providing accessible, customizable components styled with Tailwind CSS

**Routing**: Wouter for lightweight client-side routing (Home page and Room page)

**State Management**: 
- React Context API for global game state (GameContext)
- TanStack React Query for server state management
- Local component state with React hooks

**Styling Approach**:
- Tailwind CSS with custom Arabic game theme
- RTL (right-to-left) layout configuration throughout
- Arabic fonts: Noto Sans Arabic (primary), Cairo (headings), Amiri (decorative)
- Color system inspired by Jackbox Games with role-based colors (green for players, red for spies)
- Dark/light theme support via ThemeProvider

**Real-time Communication**: WebSocket connection for bidirectional game updates between client and server

**Form Handling**: React Hook Form with Zod validation for type-safe form inputs

## Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js

**Real-time Protocol**: WebSocket Server (ws library) for handling game events and broadcasting room updates

**Session Architecture**: In-memory game state management without traditional database persistence
- Room data stored in Map structures
- Player-to-room mappings for quick lookups
- Stateless game rounds with no data persistence between server restarts

**Game Logic**:
- Server-authoritative game flow control
- Centralized game phase management (lobby, category_voting, word_reveal, questioning, spy_voting, etc.)
- Word generation system with categorized Arabic word banks
- Automatic spy count calculation based on player count with host override capability
- Vote aggregation and consensus mechanisms

**API Design**: Message-based WebSocket protocol with typed messages (WebSocketMessage/ServerMessage) rather than REST endpoints

**Build System**: 
- esbuild for server bundling with dependency allowlisting for cold start optimization
- Vite for client builds
- Custom build script coordinating both builds

## External Dependencies

**Database**: PostgreSQL with Drizzle ORM configured (schema defined but actual usage appears minimal - game state is primarily in-memory)

**Session Store**: connect-pg-simple for PostgreSQL-backed session storage (configured but game state uses WebSocket connections)

**Word Data**: Static Arabic word banks organized by categories (countries, fruits_vegetables, etc.) stored in server-side TypeScript files

**Third-party Services**: None - completely self-contained application

**Development Tools**:
- Replit-specific plugins for dev banner, cartographer, and runtime error overlay
- Vite HMR for hot module replacement in development
- TypeScript with strict mode for type safety

**Key Architectural Decisions**:

1. **In-memory vs Persistent Storage**: Game state is ephemeral and stored in memory rather than database, prioritizing simplicity and real-time performance over persistence. This means games reset on server restart.

2. **WebSocket-first Communication**: Chose WebSocket over HTTP polling or SSE for bidirectional, low-latency game updates essential for multiplayer experience.

3. **Server-authoritative Design**: All game logic executes on server with clients acting as view layers, preventing cheating and ensuring consistent game state.

4. **TypeScript Shared Schema**: Common types (shared/schema.ts) used by both client and server for compile-time safety and reduced runtime errors.

5. **Monorepo Structure**: Client and server code in single repository with shared types, simplifying development and deployment on Replit.

6. **Arabic-first Internationalization**: RTL layout, Arabic fonts, and Arabic content throughout - not a translation layer but native Arabic design.