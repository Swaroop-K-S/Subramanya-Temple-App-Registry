# Rerender Assassin (React.memo)

Rule: All heavy components (especially Dashboard Charts and big lists) must be wrapped in `React.memo`.

Reasoning: Prevents unnecessary react reflows and re-renders when parent state changes, keeping the UI snappy.
