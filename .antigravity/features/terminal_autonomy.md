# Terminal Autonomy (Hands)

**Status**: ACTIVE
**Mode**: Full Shell Access
**Scope**: `npm`, `pip`, `git`, `file_system`

## Capabilities
- **Command Execution**: Can run any shell command to install dependencies, run builds, or manage git.
- **Environment Control**: Can start/stop servers (with user approval if critical) and manage environment variables.
- **Error Interception**: Captures `stderr` from failed commands for immediate analysis.

## Active Protocols
- **Package Management**: Auto-install missing deps on `ModuleNotFoundError` or `Cannot find module`.
- **Git Hygiene**: Can stage and commit work autonomously when tasks are complete.
