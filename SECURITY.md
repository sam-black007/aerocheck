# Security Guide

## Overview

AeroCheck implements multiple security measures to protect user data and ensure safe operation.

## Security Measures Implemented

### 1. Input Validation

All user inputs are validated before processing:

```typescript
// Numeric fields are parsed and validated
const value = parseFloat(input.value);
if (isNaN(value) || value < 0) {
  // Reject invalid input
}

// String inputs are sanitized
const sanitized = input.value.replace(/[<>]/g, '');
```

### 2. XSS Prevention

- React's built-in escaping prevents XSS attacks
- User input is never rendered as raw HTML
- All dynamic content uses proper React patterns

### 3. IndexedDB Security

- All data stored in IndexedDB is validated before save
- JSON.parse is wrapped in try-catch
- Data is typed with TypeScript interfaces

### 4. API Key Protection

- API keys are stored in environment variables only
- Keys are never committed to version control
- Uses `import.meta.env` for secure access

### 5. Content Security Policy

The app uses security-focused headers:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self'; 
               style-src 'self' https://fonts.googleapis.com;
               font-src 'self' https://fonts.gstatic.com;">
```

### 6. Dependency Security

- All dependencies are audited for vulnerabilities
- Regular updates to patch security issues
- Minimal dependency footprint

## Security Checklist

- [x] Input validation on all numeric fields
- [x] XSS prevention via React escaping
- [x] Safe JSON parsing with error handling
- [x] API keys in environment variables
- [x] CSP headers configured
- [x] TypeScript strict mode enabled
- [x] No eval() usage
- [x] No inline scripts
- [x] IndexedDB data sanitization
- [x] File upload validation

## Best Practices

### For Users

1. Never share your API keys
2. Keep your browser updated
3. Use HTTPS when available
4. Clear local storage when done on public computers

### For Developers

1. Run security tests before commits
2. Review dependency updates for security patches
3. Follow OWASP guidelines
4. Keep sensitive data out of code

## Reporting Security Issues

If you find a security vulnerability, please report it immediately. Do NOT create a public issue - contact the maintainers directly.

## Security Updates

Security patches are released immediately when vulnerabilities are discovered. Subscribe to release notifications for updates.
