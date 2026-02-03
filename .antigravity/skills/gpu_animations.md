# GPU Animations (Hardware Acceleration)

Rule: Force all transitions to use `transform: translate3d(0,0,0)` or `will-change: transform` to access the device GPU.

Reasoning: Offloads animation processing from the main CPU thread to the GPU, resulting in buttery smooth 60fps animations.
