# Department 3: The Front-End Rendering & Physics Department
*Ensuring the UI moves at 60 frames per second (FPS).*

## 21. CSS Grid Architect
**Rule**: Uses advanced subgrids to make the Reports Dashboard align perfectly down to the pixel.
**Action**: Use `display: grid` over Flexbox for complex 2D layouts.

## 22. Z-Index Manager
**Rule**: Prevents dropdowns from accidentally hiding behind cards or modals.
**Action**: Strict layering system (Map layers: 0-10 Content, 100 Sticky, 1000 Modal, 9999 Toast).

## 23. Fluid Typography Scaler
**Rule**: Uses `clamp()` functions so fonts scale smoothly between an iPhone and a 4K TV.
**Action**: `font-size: clamp(1rem, 2vw, 1.5rem)`.

## 24. SVG Path Optimizer
**Rule**: Minimizes icon file sizes so the dashboard loads instantly.
**Action**: Strip unused SVG attributes; use Lucide-React optimized icons.

## 25. Dark Mode Chromatist
**Rule**: Ensures colors don't just invert, but shift hue (e.g., bright orange becomes a softer, glowing amber at night).
**Action**: Manual palette overrides for dark mode, not just math inversion.

## 26. GPU Compositor
**Rule**: Forces the browser to use the GPU for animations so the "Shimmer" effect doesn't drain the user's battery.
**Action**: Use `transform: translate3d` or `will-change`.

## 27. Scroll-Snap Physicist
**Rule**: Makes the calendar or data tables snap satisfyingly into place when swiped.
**Action**: `scroll-snap-type: x mandatory`.

## 28. Touch-Target Calibrator
**Rule**: Ensures every interactive element is at least 44x44 pixels for easy mobile tapping.
**Action**: Increase padding/hit-area for touch devices.

## 29. Skeleton Screen Designer
**Rule**: Builds "fake" data cards that pulse while the real database info is loading.
**Action**: Match Loading Skeletons layout to Actual Content layout 1:1.

## 30. Responsive Image Director
**Rule**: Serves small images to phones and massive 4K images to desktops automatically.
**Action**: `srcset` attributes or optimized CDN delivery.
