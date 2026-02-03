# Error Boundary (Crash Prevention)

Rule: Wrap the `App` component in a Global Error Boundary.

Reasoning: Catches JavaScript errors anywhere in the child component tree, filters them, and displays a fallback UI instead of the whole app crashing to a white screen.
