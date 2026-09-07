# Security Policy

## Supported Versions

CIM-Life is deployed as a continuous client-side single-page application hosted on GitHub Pages. Only the latest release on the `main` branch deployed to [ncuim.github.io](https://ncuim.github.io) receives active security maintenance and updates.

| Version / Deployment | Supported          |
| -------------------- | ------------------ |
| `main` (Online)      | :white_check_mark: |
| Older snapshots      | :x:                |

## Security Architecture & Privacy

CIM-Life is designed with a strict privacy-first architecture:
- **Client-Side Only**: All course schedules, credit audit logs, and user profile data reside solely within your browser (`LocalStorage`).
- **No Password Collection**: The CIS bookmarklet and course synchronization scripts execute locally within your browser session; student credentials and session tokens are never transmitted to external servers.
- **Static Assets**: All public curriculum snapshots and seat allocations are distributed via static JSON data files.

## Reporting a Vulnerability

If you discover a security vulnerability or privacy concern within CIM-Life:

1. **Do not create a public GitHub issue.**
2. Please report the issue privately through [GitHub Private Vulnerability Reporting](https://github.com/NCUIM/NCUIM.github.io/security/advisories/new) or contact the project maintainers via email at `1014308g@gmail.com`.
3. Provide a detailed description of the vulnerability, including steps to reproduce, potential impact, and suggested mitigation if available.

We appreciate responsible disclosure and will review, acknowledge, and resolve verified reports promptly.
