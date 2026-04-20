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
- A win occurs when symbols match a valid payline combination
- Payout = bet × multiplier from paytable
- No match → player loses bet
- Game ends when balance < minimum bet
- Paytable must always be visible to player

---

## Game Logic

- Exactly 5 independent reels
- Each reel uses a true RNG (Random Number Generator)
  - Outcomes must be independent across reels and spins
- Spin result must be determined before animation plays
  - UI only displays precomputed result
- Use a structured Paytable object (Map / Dictionary)
  - Do NOT use long if/else chains
- Only evaluate the center horizontal row (single payline)
- Prevent balance from going below zero

---

## Visuals & Sounds

- Retro theme (pixel-art inspired slot machine)
- Smooth reel animations
- Distinct visual/audio feedback:
  - Wins
  - Losses
  - Big wins

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
