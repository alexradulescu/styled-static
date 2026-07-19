# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

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
- **Static variant lookup** - Runtime variant values are matched only against build-time values
- **Own-property checks** - Inherited variant and class-name properties are ignored
- **Literal static attrs** - Attr defaults accept only explicit string, number, boolean, or `null` values
- **Generated-code escaping** - Generated string literals and CSS class segments are escaped or normalized
- **Fixed class-name policy** - There is no user-controlled class prefix or output mode
- **Safe virtual IDs** - Raw source paths never appear in JavaScript import specifiers
- **Reproducible identities** - Class hashes use a named package and package-relative path, never an absolute checkout path
- **Exact import matching** - Only the canonical package import activates extraction
- **No JavaScript evaluation** - Extraction reads syntax and trusted CSS text only
- **Minimal runtime** - Small attack surface

Application CSS is trusted developer input. styled-static does not sanitize CSS source code and must not be used to compile untrusted templates.

## Security Updates

Security updates will be released as patch versions. We recommend keeping your dependencies up to date.

## Acknowledgments

We appreciate responsible disclosure from the security community.
