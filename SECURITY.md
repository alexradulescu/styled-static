# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within styled-static, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email the maintainers directly or use [GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We aim to respond within 48 hours and will work with you to understand and address the issue.

## Security Measures

This library implements several security measures:

- **Build-time CSS extraction** - No runtime CSS parsing reduces XSS attack surface
- **Input sanitization** - User-controlled values are sanitized before use
- **Defense-in-depth** - Multiple layers of protection against common web vulnerabilities
- **Minimal runtime** - Small attack surface (~300 bytes)

## Security Updates

Security updates will be released as patch versions. We recommend keeping your dependencies up to date.

## Acknowledgments

We appreciate responsible disclosure from the security community.
