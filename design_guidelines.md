# تصميم لعبة "من هو الجاسوس؟" - Design Guidelines

## Design Approach

**Reference-Based Design**: Inspired by **Jackbox Games** and **Among Us** interfaces - colorful, accessible multiplayer game designs with clear role-based information display, playful animations, and card-based layouts optimized for social gaming experiences.

## Color System

```
Primary (Arabic Green): #2E8B57
Secondary (Deep Red): #DC143C
Background (Warm Beige): #F5F5DC
Text (Dark Slate): #2F4F4F
Accent (Steel Blue): #4682B4
Success (Lime Green): #32CD32

Role-Based Colors:
- Regular Players: Green tints
- Spies: Red tints
- Active Turn: Blue highlight
- Timer Warning: Red progression
```

## Typography (RTL Arabic)

**Font Families**: Noto Sans Arabic (primary), Cairo (headings), Amiri (decorative elements)

**Hierarchy**:
- Game Title: 48px bold
- Section Headers: 32px bold
- Player Names: 24px medium
- Body Text: 18px regular
- Button Text: 20px bold
- Timer Display: 36px bold

## Layout System

**Spacing Units**: Tailwind units of 3, 4, 6, 8 for consistent rhythm (p-4, m-6, gap-8)

**RTL Configuration**: All layouts flow right-to-left, text alignment right by default

## Core Components

### Room Cards
- Rounded corners (rounded-xl)
- Elevated shadow for depth
- Player list with ready indicators (checkmarks/waiting icons)
- Host crown icon
- Large join/create buttons (min h-14)

### Game Board
- Central content area (max-w-4xl)
- Sidebar for chat (w-80, sticky)
- Player grid (2-3 columns on desktop, 1 on mobile)
- Prominent timer at top center

### Word Display Cards
- Full-width card with word centered
- "أنت الجاسوس" in dramatic red styling
- Info button (i icon) in top-left corner
- Subtle pulse animation on reveal

### Voting Interface
- Grid of player avatars/names
- Radio button selection
- Large submit button
- Vote count visualization with progress bars

### Question/Answer System
- Speech bubble design for questions
- Player selector dropdown/grid
- Question counter badge (e.g., "2/3")
- Countdown timer ring animation

### Results Screen
- Podium-style leaderboard
- Point gain animations (+1 particles)
- Winner celebration effects
- "Next Round" button

### Chat Panel
- Sticky sidebar (right side for RTL)
- Message bubbles with player colors
- Input at bottom with send icon
- Auto-scroll to latest

## Responsive Breakpoints

**Desktop (lg:)**: 3-column layouts, full sidebar
**Tablet (md:)**: 2-column layouts, collapsible chat
**Mobile (base)**: Single column, overlay chat button

## Interactive Elements

### Buttons
- Large touch targets (min h-12 for mobile)
- Rounded (rounded-lg)
- Clear hover states (slight scale, brightness change)
- Disabled states (opacity-50)

### Timers
- Circular progress ring
- Color transitions (green → yellow → red)
- Pulse effect on final 10 seconds
- Sound indicator points

### Animations
**Minimal & Purposeful**:
- Card entrance: Fade + slide
- Turn transitions: Smooth crossfade
- Vote reveals: Staggered count-up
- Point additions: Number pop-up

## Game-Specific UI Patterns

### Category Voting
- Large icon cards for each category (دول, خضروات وفواكه, حيوانات, سيارات)
- Selected state with border + checkmark
- Vote count badges on each option
- Tiebreaker animation (random selection spin)

### Role Assignment Reveal
- Dramatic card flip animation
- 2-second suspense before reveal
- Different card colors for roles
- "شاهد كلمتك" (View your word) button

### Spy Guess Interface
- Text input with Arabic keyboard support
- Character counter
- Submit with confirmation
- Player voting UI for correctness

### Ready System
- Player list with status indicators
- Host-only "بدء اللعبة" button (highlighted)
- Player "استعداد" toggles (checkmark when ready)
- Minimum player count warning

## Accessibility

- High contrast ratios for Arabic text
- Large, well-spaced interactive elements
- Clear focus indicators
- Screen reader support for game states
- Keyboard navigation (Tab flow RTL)

## Visual Flourishes

- Subtle particle effects on wins
- Card shadows and depth
- Smooth state transitions
- Playful icons (spy magnifying glass, question marks)
- Color-coded player indicators throughout