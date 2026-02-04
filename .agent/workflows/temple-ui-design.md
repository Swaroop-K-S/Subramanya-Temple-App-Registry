---
description: Temple OS Visual Design Constitution - Comprehensive UI/UX rules for the Subramanya Temple Management Suite
---

# Temple OS Visual Design Constitution

> **Summon this skill for ALL UI design work.** These rules define the sacred visual language of the application.

---

## Category 1: Visual Physics (Eye-Correct Design)

### 1.1 The 8-Point Grid System
**Rule:** Every margin, padding, and element height must be a multiple of 8px.
```css
/* ✅ CORRECT */
padding: 8px;    /* 8 */
padding: 16px;   /* 8 × 2 */
padding: 24px;   /* 8 × 3 */
padding: 32px;   /* 8 × 4 */
margin: 48px;    /* 8 × 6 */

/* ❌ WRONG - Never use */
padding: 7px;
padding: 13px;
margin: 15px;
```
**Why:** Creates subconscious visual rhythm.

---

### 1.2 Golden Ratio Typography (1.618)
**Rule:** Font sizes follow the Fibonacci scale.
```css
/* Base: 16px body text */
--text-body: 16px;         /* Base */
--text-subheader: 26px;    /* 16 × 1.618 */
--text-header: 42px;       /* 26 × 1.618 */
--text-title: 68px;        /* 42 × 1.618 */
--text-small: 10px;        /* 16 ÷ 1.618 */
```

**Fluid Typography:** Use `clamp()` for responsive scaling:
```css
font-size: clamp(1rem, 2vw + 0.5rem, 1.625rem);
```

---

### 1.3 The 60-30-10 Color Rule
| Percentage | Role | Implementation |
|------------|------|----------------|
| **60%** | Neutral | Slate/White backgrounds, text |
| **30%** | Secondary/Brand | Temple Gold/Amber (Saffron) |
| **10%** | Accent (CTA) | Emerald Green or Royal Blue |

```css
:root {
  /* 60% Neutral */
  --bg-page: #F8FAFC;
  --bg-card: rgba(255, 255, 255, 0.65);
  
  /* 30% Brand */
  --color-temple-gold: #F59E0B;
  --color-temple-saffron: #D97706;
  
  /* 10% Accent */
  --color-temple-green: #10B981;
  --color-temple-rose: #F43F5E;
}
```

---

### 1.4 Z-Axis Elevation (Material 3)
**Rule:** Lighter objects are "closer" to the user.
```
Background (Darkest) → Cards (Lighter) → Modals (Lightest/Brightest)
```

**Shadow Implementation:**
```css
/* Background elements */
--shadow-ambient: 0 20px 60px -15px rgba(0, 0, 0, 0.05);

/* Cards (mid-level) */
--shadow-card: 0 10px 25px -5px rgba(0, 0, 0, 0.1);

/* Modals (highest) */
--shadow-modal: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

---

### 1.5 Deep Glass Physics
**Rule:** Glass cards MUST have these 4 layers:
```css
.glass-card {
  /* Layer 1: Background Blur */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  
  /* Layer 2: Fill */
  background: rgba(255, 255, 255, 0.70); /* Light Mode */
  /* background: rgba(15, 23, 42, 0.60); Dark Mode */
  
  /* Layer 3: Specular Border (Light catching edge) */
  border: 1px solid rgba(255, 255, 255, 0.20);
  
  /* Layer 4: Shadow (Separation) */
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}
```

---

### 1.6 Optical Alignment
**Rule:** Mathematically centered ≠ Visually centered.

**Examples:**
- Play icons (▶) need to be nudged **slightly right** in a circle
- Triangle icons need **slight offset** to look centered
- Text with descenders (g, y, j) needs **optical adjustment**

---

## The Temple OS Visual Constitution (MANDATORY)

> ⚠️ **These rules are NON-NEGOTIABLE. Summon them for EVERY UI element.**

### The "Deep Glass" Formula (4 Layers)
**Rule:** Never use simple opacity. All glass elements MUST combine 4 layers:

```css
.glass-card {
  /* Layer 1: Background Blur - MINIMUM 12px */
  @apply backdrop-blur-xl;           /* 12px blur */
  
  /* Layer 2: Fill */
  @apply bg-white/70;                /* Light Mode */
  /* @apply bg-slate-900/60;         /* Dark Mode */
  
  /* Layer 3: Specular Border (Light catching edge) */
  @apply border border-white/20;     /* 1px @ 20% opacity */
  
  /* Layer 4: Shadow (Separation from background) */
  @apply shadow-lg;
}
```

---

### The "Breathing Room" (Whitespace = Luxury)
**Rule:** Dense data looks cheap. Luxury is defined by space.

**Implementation:** Internal padding = **2× font size**
```css
/* If font is 16px, padding must be 32px */
.premium-card {
  @apply text-base p-8;   /* 16px text → 32px (p-8) padding */
}

/* If font is 14px, padding must be 28px (round to 32px) */
.compact-card {
  @apply text-sm p-6;     /* 14px text → 24px (p-6) padding */
}
```

---

### Elevation via Shadow Physics
**Rule:** Distance determines shadow softness.

| Element | Distance | Shadow Class | Effect |
|---------|----------|--------------|--------|
| Buttons | Close | `shadow-sm` | Small, sharp |
| Cards | Medium | `shadow-lg` | Medium, soft |
| Modals | Far (Floating) | `shadow-2xl` | Large, very soft |
| Dropdowns | Hovering | `shadow-xl` | Large, defined |

```css
/* Buttons - Close to surface */
.btn { @apply shadow-sm hover:shadow-md; }

/* Cards - Mid elevation */
.card { @apply shadow-lg; }

/* Modals - Maximum elevation */
.modal { @apply shadow-2xl; }
```

---

### Corner Radius Consistency
**Rule:** The app must NOT have an identity crisis. Pick ONE radius and use it everywhere.

```css
/* ✅ CORRECT: Consistent rounded-2xl */
.card { @apply rounded-2xl; }
.modal { @apply rounded-2xl; }
.button { @apply rounded-xl; }     /* Slightly smaller is OK */
.input { @apply rounded-xl; }

/* ❌ WRONG: Mixed radii */
.card { @apply rounded-3xl; }      /* Round */
.modal { @apply rounded-lg; }      /* Less round */
.button { @apply rounded-md; }     /* Almost square */
```

**Temple OS Standard:**
- Containers (Cards, Modals): `rounded-2xl` (16px) or `rounded-3xl` (24px)
- Interactive (Buttons, Inputs): `rounded-xl` (12px)
- Small elements (Tags, Pills): `rounded-full`

---

### Contrast for Accessibility (WCAG AA)
**Rule:** Text on glass MUST be legible for elderly clerks.

```css
/* ❌ NEVER use light grey on glass */
.bad { @apply text-gray-400; }

/* ✅ Use high-contrast colors */
.good { @apply text-slate-900; }           /* Dark text on light glass */
.good-dark { @apply text-white; }          /* White on dark glass */

/* For dynamic backgrounds, add drop shadow */
.text-on-image {
  @apply text-white drop-shadow-sm;        /* Shadow for readability */
}
```

**Minimum Contrast Ratios:**
- Normal text: **4.5:1**
- Large text (18px+): **3:1**

---

### Semantic Motion Physics
**Rule:** Nothing appears instantly. Everything must obey physics.

| Motion Type | Animation | Timing |
|-------------|-----------|--------|
| **Entering** | Spring (overshoot, settle) | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| **Exiting** | Ease-in (slow start, fast end) | `ease-in` |
| **Hover** | Ease-out (fast start, slow end) | `ease-out` |

```css
/* Modal Enter - Spring */
@keyframes modal-enter {
  0% { transform: scale(0.95); opacity: 0; }
  60% { transform: scale(1.02); }  /* Overshoot */
  100% { transform: scale(1); opacity: 1; }
}

/* Modal Exit - Ease-in */
@keyframes modal-exit {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0; }
}

.modal-enter { animation: modal-enter 300ms cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-exit { animation: modal-exit 200ms ease-in; }
```

---

### Visual Hierarchy (The "Squint Test")
**Rule:** The most important element must be visually heaviest.

**Test:** Blur your eyes. Can you still see the primary CTA?

**Implementation Checklist:**
```css
/* Primary CTA - Maximum Visual Weight */
.btn-primary {
  @apply bg-gradient-to-r from-orange-500 to-red-500;  /* Color */
  @apply text-white font-bold text-lg;                  /* Contrast */
  @apply py-4 px-8;                                     /* Size */
  @apply shadow-xl shadow-orange-500/30;                /* Glow */
}

/* Secondary - Reduced Weight */
.btn-secondary {
  @apply bg-white/10 border border-white/20;
  @apply text-slate-700 font-medium;
  @apply py-3 px-6;
  @apply shadow-sm;
}

/* Tertiary - Minimal Weight */
.btn-tertiary {
  @apply bg-transparent;
  @apply text-slate-500 font-normal;
  @apply py-2 px-4;
}
```

---

## Category 2: Cognitive Psychology (Brain-Friendly)

### 2.1 Hick's Law (The "Seva" Rule)
**Rule:** Decision time increases with number of choices.

**Implementation:**
```jsx
// ❌ WRONG: 50 sevas at once
<SevaGrid sevas={allSevas} />

// ✅ CORRECT: Grouped by type
<SevaCategory title="Fire Sevas (Homa)" sevas={fireSevas} />
<SevaCategory title="Water Sevas (Abhisheka)" sevas={waterSevas} />
<SevaCategory title="Special Sevas" sevas={specialSevas} />
```

---

### 2.2 Fitts's Law (The "Thumb" Rule)
**Rule:** Target size and distance determine usability.

**Implementation:**
- "Book Now" button: **Large** and in **bottom-right thumb zone**
- Minimum touch target: **44×44px** (even if icon is 20px)
```jsx
<button className="p-3"> {/* Expands hit area */}
  <Icon size={20} />
</button>
```

---

### 2.3 The Doherty Threshold (<400ms)
**Rule:** Feedback must occur within 400ms.

**Implementation:**
```jsx
// Loading > 400ms? Show skeleton, NOT spinner
{isLoading ? <SkeletonCard /> : <SevaCard />}
```

---

### 2.4 Miller's Law (Chunking)
**Rule:** Average person holds 7 items in working memory.

**Implementation:**
```jsx
// Break forms into steps, max 7 fields per step
<Step1DateSelection />  {/* 2-3 fields */}
<Step2DevoteeInfo />    {/* 3-4 fields */}
<Step3Payment />        {/* 2-3 fields */}
```

---

### 2.5 The Zeigarnik Effect (Progress Bars)
**Rule:** Uncompleted tasks are remembered better.

**Implementation:**
```jsx
<ProgressBar current={2} total={3} />
// Shows "Step 2 of 3" to urge completion
```

---

### 2.6 Gestalt Principle of Proximity
**Rule:** Objects close together are perceived as a group.

**Implementation:**
```
✅ CORRECT:
[Seva Name]  [₹51]  ← Price close to name
                    [Book Now]  ← Button separate

❌ WRONG:
[Seva Name]  [₹51]  [Book Now]  ← Price near button, confusing
```

---

### 2.7 Affordance Theory
**Rule:** Buttons must LOOK clickable.

**Implementation:**
```css
/* Buttons need visual affordance */
.btn-primary {
  background: linear-gradient(to-br, #f97316, #ea580c);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
  transform: translateY(0);
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(249, 115, 22, 0.4);
}
```

---

## Category 3: Vedic & Technical Precision

### 3.1 Bi-Lingual Line Height
**Rule:** Kannada/Sanskrit scripts have tall ligatures.

```css
/* English */
.text-en {
  line-height: 1.5; /* leading-normal */
}

/* Kannada */
.text-kn {
  line-height: 1.65; /* leading-relaxed */
  font-family: 'Noto Sans Kannada', sans-serif;
}
```

---

### 3.2 Semantic Color Mapping
**Rule:** Colors must match the culture.

| Standard | Temple OS Equivalent |
|----------|---------------------|
| Warning Yellow | **Turmeric/Amber** (#F59E0B) |
| Error Red | **Gentle Rose** (#F43F5E) |
| Success Green | **Emerald/Wealth** (#10B981) |
| Info Blue | **Indigo/Trust** (#6366F1) |

---

### 3.3 Spring Physics (Animation)
**Rule:** Nothing in nature moves linearly.

**Implementation:**
```css
/* All popups use spring, NOT ease-in-out */
@keyframes spring-in {
  0% { transform: scale(0.95); opacity: 0; }
  60% { transform: scale(1.02); }
  100% { transform: scale(1); opacity: 1; }
}

/* Tailwind equivalent */
.animate-in {
  animation: spring-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

**Spring Values:**
- Stiffness: 300
- Damping: 30

---

### 3.4 The "Squint Test" (Hierarchy)
**Rule:** If you blur your eyes, you should still see the most important button.

**Checklist:**
1. [ ] Primary CTA has highest visual weight (Color + Size + Shadow)
2. [ ] Secondary actions are visually lighter
3. [ ] Text hierarchy is clear (Title → Subtitle → Body → Caption)

---

### 3.5 Context-Aware Theming
**Rule:** UI changes with the Panchangam.

| Time of Day | Header Color | Mood |
|-------------|--------------|------|
| Sunrise (5-8 AM) | Soft Orange | Sacred Awakening |
| Morning (8-12 PM) | Golden Amber | Active Devotion |
| Afternoon (12-4 PM) | Warm Saffron | Peak Activity |
| Evening (4-7 PM) | Deep Orange | Twilight Prayer |
| Night (7 PM - 5 AM) | Deep Purple | Cosmic Rest |

---

### 3.6 Defensive Design (Error States)
**Rule:** Never blame the user.

```jsx
// ❌ WRONG
<Error>Invalid Input</Error>

// ✅ CORRECT  
<Error>Please check the Gothra spelling</Error>

// ❌ WRONG
<Error>Failed to submit</Error>

// ✅ CORRECT
<Error>We couldn't complete the booking. Please try again.</Error>
```

---

## Quick Reference Checklist

Before shipping any UI component, verify:

- [ ] All spacing is multiples of 8px
- [ ] Font sizes follow Golden Ratio (16 → 26 → 42)
- [ ] Colors follow 60-30-10 rule
- [ ] Glass cards have all 4 layers
- [ ] Touch targets are minimum 44×44px
- [ ] Loading states show skeletons, not spinners
- [ ] Forms are chunked into steps (max 7 fields each)
- [ ] Progress bars show completion status
- [ ] Buttons have visual affordance (shadows, gradients)
- [ ] Kannada text has `leading-relaxed` (1.65)
- [ ] Animations use spring physics
- [ ] Error messages are friendly and helpful
- [ ] The "Squint Test" passes

---

## Usage

When designing any UI component, reference this skill:

```
/temple-ui-design
```

Always apply these rules before submitting any visual changes.
