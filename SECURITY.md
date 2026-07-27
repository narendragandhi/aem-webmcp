# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in AEM WebMCP, please report it responsibly:

1. **Do not** open a public GitHub issue for security vulnerabilities
2. Email the maintainer or use [GitHub's private vulnerability reporting](https://github.com/narendragandhi/aem-webmcp/security/advisories/new)
3. Include: description, steps to reproduce, potential impact
4. Allow reasonable time for a response before public disclosure

## Scope

This security policy applies to the AEM WebMCP JavaScript clientlib code. It does not cover:

- AEM platform security (contact Adobe)
- AEM Core Components security (contact Adobe)
- Third-party dependencies (report upstream)

## Security Measures

- OWASP dependency scanning in CI (see `.github/workflows/ci.yml`)
- Input validation on all tool parameters
- CSRF protection for form-related tools
- Rate limiting support via OSGi configuration
- PII-safe logging (no sensitive data in console output)
- Content Security Policy compatible (no `eval()`, no inline scripts)

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.1.x   | Yes       |
| < 2.1   | No        |

## Disclosure Policy

- Vulnerabilities will be addressed in the next patch release
- Critical vulnerabilities may receive immediate hotfix releases
- Security advisories will be published via GitHub
