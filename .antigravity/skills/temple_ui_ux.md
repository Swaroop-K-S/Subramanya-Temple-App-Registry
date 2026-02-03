# Temple App UI/UX v2.0

Card Hierarchy: Never use flat white backgrounds. All cards MUST use "Deep Glass": bg-gradient-to-br from-white/90 via-white/60 to-white/30 backdrop-blur-xl border border-white/40 shadow-xl.

Seva Card Theming: The src/App.jsx Seva cards MUST NOT use hardcoded colors. They must dynamically use the theme.bgGradient and theme.icon derived from the getSevaTheme() utility to distinguish Fire (Orange) vs Water (Blue) rituals.

Typography & Multi-Lingual: Big stats are text-4xl font-black. Kannada/Sanskrit text in Receipt.jsx must always use line-height: 1.6 to prevent ligature clipping.

Motion: Interactive cards must lift on hover: transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl.
