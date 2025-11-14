# Bottle Filling Digital Twin - UI Application

A modern React application providing the user interface for the Bottle Filling Digital Twin system, featuring real-time simulation visualization powered by Ansys Fluent and Nvidia Omniverse.

## 🚀 Features

- **Modern Tech Stack**: React 18+ with TypeScript, Vite for fast builds
- **3D Visualization**: Integration with Nvidia Omniverse for real-time rendering
- **Fluid Simulation**: Interface for Ansys Fluent CFD simulations
- **Multiple Bottle Designs**: Support for various bottle designs and fluid models
- **Real-time Updates**: Live simulation progress and results
- **Responsive Design**: Optimized for desktop and tablet devices
- **Accessibility**: WCAG AAA compliant with full keyboard navigation
- **Performance**: Lazy loading, code splitting, and optimized bundles

## 📋 Prerequisites

### Required Software

- **Node.js**: Version 18.0.0 or higher
- **pnpm**: Version 8.0.0 or higher (preferred package manager)
- **Git**: For version control

### System Requirements

- **Operating System**: Windows 10/11, macOS 10.15+, or Linux
- **Memory**: Minimum 8GB RAM (16GB recommended for development)
- **Disk Space**: At least 2GB free space
- **Graphics**: DirectX 11 compatible (for Omniverse integration)

### Backend Dependencies

This UI application requires the following backend services to be running:

- **Ansys Fluent Server**: For CFD simulation processing
- **Omniverse Kit**: For 3D visualization and rendering
- **API Backend**: REST API server (typically running on port 8080)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ansys/bottle-filling-digital-twin.git
cd bottle-filling-digital-twin/blueprint/web-app
```

### 2. Install Dependencies

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install project dependencies
pnpm install
```

### 3. Environment Configuration

Create a \`.env.local\` file in the root directory:

# Development Settings

VITE_DEV_MODE=true
VITE_ENABLE_DEBUG=true

# API Omniverse Configuration

The Omniverse Stream OKAS configuration will be defined in the blueprint for the `/docker/stream.config.json`.
Where is going to be Stream Server for that deployment Use Case.

as e.g. onced the `source=='stream'` the stream.config.json:

```json
"stream": {
    "$comment": "Required props if source is set to 'stream'. Mocked at localhost:3004",
    "appServer": "https://bfdt-app.example.com",
    "streamServer": "http://localhost:3004",
}
```

the `streamServer` is gonna be consumed by the web-app and will handle all the request trought `StreamingService.ts`

## 🚀 Development

### Start Development Server

### Start Development Server

```bash
pnpm run dev
```

> [!TIP]
> Open in browser [http://localhost:3001](http://localhost:3001)

### Available Scripts

```bash
# Development
pnpm dev              # Start development server with hot reload
pnpm build            # Build for production
pnpm preview          # Preview production build locally

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues automatically
pnpm format           # Format code with Prettier
pnpm format:check     # Check code formatting
pnpm type-check       # Run TypeScript type checking

# Testing
pnpm test             # Run unit tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage report
pnpm test:e2e         # Run end-to-end tests
pnpm test:e2e:ui      # Run E2E tests with UI

# Git Hooks
pnpm prepare          # Set up Husky git hooks
```

## 🧪 Testing

### ✅ **Status**: Jest Testing Infrastructure Complete & Working!

The project includes comprehensive testing with Jest and React Testing Library:

- **10 tests PASSED** ✅
- **Complete test coverage** for components, pages, and utilities
- **CSS Module mocking** with identity-obj-proxy
- **Browser API mocks** (localStorage, fetch, etc.)
- **TypeScript support** with ts-jest

### **Test Commands**

```bash
# Run all tests
pnpm test

# Run tests in watch mode (recommended for development)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run specific test file
pnpm test Loading.test.tsx

# Run tests matching pattern
pnpm test --testNamePattern="renders"
```

### **Test Structure**

```
tests/
├── setup.ts              # Jest configuration and global mocks
├── utils/test-utils.tsx   # Custom render functions
├── components/            # Component unit tests
├── pages/                 # Page component tests
├── constants/             # Configuration tests
├── integration/           # Integration tests
└── __mocks__/            # Asset mocks
```

### **API Mock Test**

- Using Mockoon, you can import the file: `/mock-api/application-stream-api-Mock.json`
- It will serves the Stream API at `http://localhost:3004` for the Stream OKAS configuration.

> [!TIP]
> Download Mockoon App: [Mockoon Desktop](https://mockoon.com/download/)

### **Coverage Requirements**

- **70% minimum** for branches, functions, lines, and statements
- Excludes: `main.tsx`, `vite-env.d.ts`, `.d.ts` files

### **End-to-End Testing** (Future)

E2E tests with Playwright (to be configured):

```bash
# Run E2E tests (when configured)
pnpm test:e2e

# Install Playwright browsers
npx playwright install
```

## 🏗️ Building for Production

### Local Production Build

```bash
# Build the application
pnpm build

# Preview the production build
pnpm preview
```

### Build Output

The build process creates:

- **dist/**: Production-ready static files
- **Coverage reports**: In \`coverage/\` directory
- **Type checking**: Validates TypeScript types

### Build Optimization

The build includes:

- **Code splitting**: Automatic chunking for optimal loading
- **Tree shaking**: Removes unused code
- **Asset optimization**: Minified CSS/JS and optimized images
- **Source maps**: For debugging (configurable)

## 🚀 Deployment

### Environment-Specific Builds

```bash
# Development build
pnpm build --mode development

# Staging build
pnpm build --mode staging

# Production build
pnpm build --mode production
```

### Deployment Options

#### 1. Static File Hosting

The built application can be deployed to any static file hosting service:

- **Netlify**: \`netlify deploy --prod --dir dist\`
- **Vercel**: \`vercel --prod\`
- **AWS S3**: Upload \`dist/\` contents to S3 bucket
- **Azure Static Web Apps**: Use Azure CLI or GitHub Actions

#### 2. Docker Deployment

- Use the `./nginx.conf` to serve the build application
- Check and Reuse the existing Docker file in `../docker/Dockerfile.web-app` if available
- Follow best practices for composable deployments.

#### 3. Server Integration

For integration with backend services:

1. Configure reverse proxy (nginx/Apache)
2. Set up environment variables
3. Configure CORS policies
4. Set up SSL certificates

## 🔧 Configuration

### Environment Variables

| Variable                      | Description                 | Default                       | Required |
| ----------------------------- | --------------------------- | ----------------------------- | -------- |
| \`VITE_API_BASE_URL\`         | Backend API URL             | \`http://localhost:8080/api\` | Yes      |
| \`VITE_OMNIVERSE_STREAM_URL\` | Omniverse WebSocket URL     | \`ws://localhost:8899\`       | No       |
| \`VITE_FLUENT_SERVER_URL\`    | Fluent server URL           | \`http://localhost:1234\`     | No       |
| \`VITE_DEV_MODE\`             | Enable development features | \`false\`                     | No       |

### Code Quality Configuration

The project includes pre-configured:

- **ESLint**: Code linting with React and accessibility rules
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit checks
- **TypeScript**: Strict type checking

### Performance Configuration

- **Bundle size analysis**: Use \`pnpm build --analyze\`
- **Memory monitoring**: React DevTools Profiler
- **Network optimization**: Service worker (configurable)

## 🐛 Troubleshooting

### Common Issues

#### 1. Installation Problems

```bash
# Clear package manager cache
pnpm store prune

# Delete node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### 2. Build Errors

```bash
# Type checking issues
pnpm type-check

# Linting issues
pnpm lint:fix
```

#### 3. Development Server Issues

```bash
# Kill processes on port 3000
npx kill-port 3000

# Clear Vite cache
rm -rf node_modules/.vite
```

#### 4. Backend Connection Issues

- Verify backend services are running
- Check environment variables
- Verify CORS configuration
- Check network connectivity

### Getting Help

- **Issues**: Create an issue in the repository
- **Documentation**: Check \`docs/\` directory
- **Team Chat**: Use internal communication channels

## 📁 Project Structure

\`\`\`
web-app/
├── public/ # Static assets
├── src/
│ ├── components/ # Reusable UI components
│ ├── hooks/ # Custom React hooks
│ ├── pages/ # Route-based page components
│ ├── services/ # API and business logic
│ ├── store/ # State management (Zustand)
│ ├── styles/ # Global styles and themes
│ ├── types/ # TypeScript type definitions
│ ├── utils/ # Helper functions
│ └── constants/ # Application constants
├── tests/ # E2E tests
├── coverage/ # Test coverage reports
└── dist/ # Production build output
\`\`\`

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: \`git checkout -b feature/amazing-feature\`
3. **Commit** changes: \`git commit -m 'Add amazing feature'\`
4. **Push** to branch: \`git push origin feature/amazing-feature\`
5. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Maintain test coverage above 80%
- Use semantic commit messages
- Follow accessibility guidelines
- Update documentation for new features

## 📄 License

This project is proprietary software owned by Ansys, Inc. All rights reserved.

## 🔗 Related Documentation

- [Backend API Documentation](../docs/api.md)
- [Fluent Integration Guide](../docs/fluent.md)
- [Omniverse Setup Guide](../docs/omniverse.md)
- [Architecture Overview](../docs/architecture.md)
