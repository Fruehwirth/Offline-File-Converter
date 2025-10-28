# Contributing to File Converter

Thank you for your interest in contributing! This project is built with privacy and user control as core principles.

## Core Principles

1. **Privacy First**: No network activity, ever. All processing happens locally.
2. **Transparency**: Code should be readable and well-documented.
3. **Accessibility**: Everyone should be able to use this tool.
4. **Extensibility**: Easy to add new formats and features.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/your-username/offline-file-converter.git` (replace `your-username` with your GitHub username)
3. **Install** dependencies: `npm install`
4. **Run** dev server: `npm run dev`
5. **Run** tests: `npm test`

## Development Workflow

### Before Starting

- Check [open issues](https://github.com/fruehwirth/offline-file-converter/issues) to avoid duplicate work
- For major changes, open an issue first to discuss

### Making Changes

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Write/update tests
4. Ensure all tests pass: `npm test && npm run test:e2e`
5. Ensure linting passes: `npm run lint`
6. Format code: `npm run format`
7. Commit with clear messages: `git commit -m "feat: add webp support"`
8. Push to your fork: `git push origin feature/your-feature-name`
9. Open a Pull Request

### Commit Messages

Use conventional commits:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `test:` Test additions/changes
- `refactor:` Code refactoring
- `style:` Formatting, no code change
- `chore:` Maintenance tasks

## Adding New Formats

To add support for a new image format:

1. **Update Format Registry** (`src/features/conversion/formatRegistry.ts`):

   ```typescript
   {
     id: 'webp',
     label: 'WebP Image',
     mime: ['image/webp'],
     signatures: [{ offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }],
     canConvertTo: ['png', 'jpg']
   }
   ```

2. **Create Conversion Logic** (`src/features/conversion/formatToFormat.ts`):

   ```typescript
   export async function convertWebPToPng(file: File): Promise<Blob> {
     // Implementation
   }
   ```

3. **Add Worker** if processing is heavy (`src/features/workers/formatToFormat.worker.ts`)

4. **Update App.tsx** to handle the new conversion path

5. **Write Tests** for the new format

6. **Update Documentation** (README.md)

## Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier (no semicolons)
- **Linting**: ESLint with TypeScript rules
- **Comments**: JSDoc for public APIs

### Example

```typescript
/**
 * Convert an image file to the target format
 *
 * @param file - Source image file
 * @param targetFormat - Target format ID
 * @param options - Conversion options
 * @returns Converted image blob
 */
export async function convertImage(
  file: File,
  targetFormat: FormatId,
  options: ImageProcessingOptions
): Promise<Blob> {
  // Implementation
}
```

## Testing

### Unit Tests

- Test pure functions and utilities
- Use Vitest
- Place in `src/__tests__/`

```typescript
describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction(input)).toBe(expectedOutput)
  })
})
```

### E2E Tests

- Test complete user workflows
- Use Playwright
- Place in `src/__tests__/e2e/`
- **Always** test for network silence

```typescript
test('should not make network requests', async ({ page }) => {
  const requests: string[] = []
  page.on('request', req => requests.push(req.url()))

  await page.goto('/')
  // ... interact with app

  const external = requests.filter(url => !url.startsWith('http://localhost'))
  expect(external).toHaveLength(0)
})
```

## Security Requirements

**Critical**: No network activity is allowed. This is enforced by:

1. **CSP**: Content Security Policy blocks connections
2. **Guards**: Runtime guards throw errors
3. **Tests**: E2E tests fail on network activity

If you add code that requires network (DON'T), tests will fail.

## Accessibility

All interactive elements must be:

- Keyboard accessible (Tab, Enter, Space)
- Properly labeled (aria-label, aria-labelledby)
- Announced to screen readers (aria-live)
- High contrast (meet WCAG AA)

Test with:

- Keyboard only (no mouse)
- Screen reader (NVDA, JAWS, VoiceOver)
- Browser zoom (200%)

## Documentation

Update documentation when:

- Adding new features
- Changing public APIs
- Adding configuration options
- Discovering limitations

Update:

- `README.md` for user-facing changes
- JSDoc comments for code changes
- `CHANGELOG.md` for releases

## Pull Request Process

1. Ensure tests pass and code is linted
2. Update documentation
3. Link related issues
4. Request review
5. Address feedback
6. Squash commits if requested

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Testing

- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manually tested

## Checklist

- [ ] Tests pass
- [ ] Linting passes
- [ ] Documentation updated
- [ ] No network activity (if applicable)
```

## Questions?

- Open an [issue](https://github.com/fruehwirth/offline-file-converter/issues)
- Start a [discussion](https://github.com/fruehwirth/offline-file-converter/discussions)

## Code of Conduct

Be respectful, inclusive, and collaborative. We're all here to build something useful and private.

---

**Thank you for contributing to a more private web!** 🔒
