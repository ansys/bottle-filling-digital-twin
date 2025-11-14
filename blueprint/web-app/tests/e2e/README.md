# E2E Testing with Playwright

This directory contains end-to-end tests for the Bottle Filling Digital Twin UI application using Playwright.

## Setup

The E2E testing framework is fully configured and ready to use. All necessary dependencies are installed via the main `package.json`.

## Test Structure

```text
tests/e2e/
├── README.md                    # This documentation
├── global.setup.ts             # Global Playwright setup and configuration
├── pages/
│   └── HomePage.ts             # Page Object Model for HomePage
├── homepage.spec.ts            # Core HomePage E2E tests
└── homepage-advanced.spec.ts   # Advanced testing scenarios
```

## Page Object Model

We use the Page Object Model pattern for maintainable and reusable test code:

- **HomePage.ts**: Contains all selectors and methods for interacting with the HomePage component
- Provides methods like `goto()`, `getTitle()`, `checkNavigation()`, etc.
- Encapsulates all page-specific logic

## Test Coverage

### Core Tests (`homepage.spec.ts`)

- ✅ Page loading and rendering
- ✅ Title and branding verification
- ✅ Navigation functionality
- ✅ Key sections presence
- ✅ Logo and header elements
- ✅ Footer information
- ✅ Page metadata and SEO

### Advanced Tests (`homepage-advanced.spec.ts`)

- ✅ Responsive design testing (mobile, tablet, desktop)
- ✅ Accessibility compliance (WCAG guidelines)
- ✅ Performance monitoring (load times, resource usage)
- ✅ User interaction flows
- ✅ Error handling and edge cases

## Running Tests

### Command Line

```bash
# Run all E2E tests
pnpm test:e2e

# Run E2E tests with UI mode (interactive)
pnpm test:e2e:ui

# Run specific test file
pnpm test:e2e homepage.spec.ts

# Run tests in headed mode (see browser)
pnpm test:e2e --headed

# Run tests with specific browser
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
pnpm test:e2e --project=webkit
```

### Development Workflow

1. Start the development server: `pnpm dev`
2. Run E2E tests: `pnpm test:e2e`
3. For debugging, use UI mode: `pnpm test:e2e:ui`

## Configuration

The Playwright configuration is in `playwright.config.ts`:

- **Test Directory**: `./tests/e2e`
- **Global Setup**: Automated server startup and health checks
- **Browsers**: Chromium, Firefox, WebKit
- **Base URL**: `http://localhost:3001`
- **Timeouts**: 30 seconds per test
- **Retries**: 2 retries on CI, 0 locally
- **Reports**: HTML and JUnit formats

## Test Results

Test results are saved to:

- **HTML Report**: `playwright-report/`
- **JUnit Results**: `test-results/playwright-results.xml`
- **Screenshots/Videos**: `test-results/` (on failure)

## Best Practices

1. **Use Page Object Model**: Keep page-specific logic in page objects
2. **Wait for Elements**: Use `waitFor()` methods instead of hard delays
3. **Descriptive Test Names**: Make test purposes clear
4. **Group Related Tests**: Use `describe()` blocks for organization
5. **Clean Test Data**: Ensure tests are independent and don't affect each other
6. **Check Accessibility**: Include accessibility checks in relevant tests
7. **Performance Monitoring**: Monitor page load times and performance metrics

## Debugging

1. **Use UI Mode**: `pnpm test:e2e:ui` for interactive debugging
2. **Screenshots**: Automatic screenshots on test failure
3. **Browser DevTools**: Use `--headed` flag to see browser interactions
4. **Slow Motion**: Add `--slowMo=1000` for slower test execution
5. **Debug Console**: Use `page.pause()` to pause execution for debugging

## CI/CD Integration

The tests are configured for CI/CD environments:

- Automatic retries on failure
- JUnit XML output for test reporting
- Parallel execution optimization
- Headless browser mode
- Screenshot/video capture on failure

## Adding New Tests

1. Create test files in `tests/e2e/`
2. Use existing page objects or create new ones in `pages/`
3. Follow naming convention: `*.spec.ts`
4. Include appropriate test categories (functional, accessibility, performance)
5. Update this README with new test coverage information

## Dependencies

- **@playwright/test**: E2E testing framework
- **axios**: HTTP client for API testing
- **React Testing Library**: Component testing utilities (shared with unit tests)

For any issues or questions about E2E testing, refer to the [Playwright documentation](https://playwright.dev/) or the project maintainers.
