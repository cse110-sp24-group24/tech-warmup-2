# Slot Machine Project – Skills & Specifications

---

## Code Guidelines

Your code must be:

### Linted
- Source code should be checked for quality:
  - HTML validation
  - Proper CSS usage
  - Clean JavaScript style

### Documented
- Source code must be appropriately documented
- JavaScript should use JSDoc comments with type annotations

### Tested
- Unit tests are required at a minimum
- End-to-end tests (e.g., Playwright) are strongly encouraged
- Write tests as you go, not at the end

### Clean Code Principles
- Meaningful variable and function names
- Small, focused functions and classes
- Avoid duplicate code (DRY)
- Proper error handling
- Clear abstraction and modularity
- Easy to maintain and update

---

## Game Rules

- Player starts with a fixed token balance
- Each spin requires a bet amount
  - Must have defined minimum and maximum bet
- Bet is deducted immediately on spin
- A win occurs when symbols match on one or more valid 3-by-5 adjacent-row paths
- Payout = bet × combined multiplier from all winning paylines
- No match → player loses bet
- Game ends when balance < minimum bet
- A clean "Pay Table" tab must be visible below the slot machine
  - Opening the tab shows rules and symbol payouts
- Winning boxes must be highlighted after each spin

---

## Game Logic

- Exactly 5 independent reels
- Exactly 3 visible rows per reel
- Each reel uses a true RNG (Random Number Generator)
  - Outcomes must be independent across reels and spins
- Spin result must be determined before animation plays
  - UI only displays precomputed result
- Use a structured Paytable object (Map / Dictionary)
  - Do NOT use long if/else chains
- Evaluate all legal adjacent-row paths, left to right
  - Paths may start on any reel
  - Paths move across adjacent reels only
  - Each step may stay on the same row or move one row up/down
  - Paths cannot skip from top row directly to bottom row, or bottom row directly to top row
- A path wins when 3, 4, or 5 matching symbols appear consecutively from the left
- Multiple winning paths may pay on the same spin
- Prevent balance from going below zero

---

## Visuals & Sounds

- Retro theme (pixel-art inspired slot machine)
- Slot cells should display emblems instead of plain symbol text
- Smooth reel animations
- Distinct visual/audio feedback:
  - Wins
  - Losses
  - Big wins
- Wins must trigger confetti, a hooray sound effect, and background fireworks

---

## Skill: Retro Pixel Space Background (Interactive + Animated)

### Goal
Create a retro-futuristic pixel-art space background that feels alive and interactive without distracting from gameplay.

---

### Visual Style
- Pixel-art aesthetic (8-bit / 16-bit)
- Color palette:
  - Deep navy / black base
  - Neon accents: cyan, magenta, purple, electric blue
- Subtle gradient background (not flat black)
- CRT-style effects:
  - Scanlines
  - Glow/bloom

---

### Background Layers (Parallax)

#### Layer 1 – Star Field
- Hundreds of pixel stars
- Twinkling animation (opacity flicker)
- Slow drifting motion

#### Layer 2 – Mid Objects
- Pixel planets (with glow/rings)
- Small drifting asteroids
- Occasional satellites

#### Layer 3 – Foreground Effects
- Floating neon particles
- Faint holographic grid lines

---

### Interactivity
- Mouse movement → subtle parallax shift
- Stars react to cursor (repel or brighten)
- Click → pixel explosion / ripple effect
- Optional: glowing cursor trail

---

### Animations
- Smooth and subtle (not distracting)
- Twinkling stars
- Slow drifting objects
- Occasional shooting stars
- Pulsing glow on planets
- Big win effect: warp-speed / hyperspace animation
- Win effect: pixel fireworks in the background

---

### Performance Constraints
- Use requestAnimationFrame
- Prefer <canvas> over heavy DOM usage
- Target smooth 60fps
- Mobile optimized (reduced particles)

---

### Tech Suggestions
- HTML <canvas> for rendering
- Vanilla JS preferred
- Optional:
  - Three.js / WebGL (advanced)
  - CSS overlays (scanlines, glow)

---

### Output Requirements
- Modular, reusable background component
- Clean and readable code
- Easy integration into app
- Minimal or no dependencies

---
