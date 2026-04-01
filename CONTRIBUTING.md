# Contributing to AEM WebMCP

Thank you for your interest in contributing to AEM WebMCP! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- Java 11 or higher
- Maven 3.6+
- Node.js 18+ (for frontend development)
- Docker & Docker Compose (for local testing)
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/aem-webmcp.git
   cd aem-webmcp
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/anthropics/aem-webmcp.git
   ```

## Development Setup

### Option 1: Using Mock AEM (Recommended for Quick Start)

```bash
# Start mock AEM server
docker-compose --profile mock up -d

# Access at http://localhost:4502
```

### Option 2: Using Docker Compose with Full AEM

```bash
# Set required environment variables
export AEM_IMAGE=adobe/aem-cs-sdk:latest
export AEM_ADMIN_PASSWORD=admin

# Start full environment
docker-compose --profile full up -d
```

### Option 3: Local AEM Instance

1. Install AEM locally following [Adobe's documentation](https://experienceleague.adobe.com/docs/experience-manager-cloud-service/content/implementing/deploying/overview.html)
2. Build and deploy:
   ```bash
   mvn clean install -PautoInstallPackage
   ```

## Making Changes

### Branch Naming Convention

- `feature/` - New features (e.g., `feature/add-search-component`)
- `fix/` - Bug fixes (e.g., `fix/cart-calculation-error`)
- `docs/` - Documentation updates (e.g., `docs/update-readme`)
- `test/` - Test additions/updates (e.g., `test/add-form-e2e-tests`)
- `refactor/` - Code refactoring (e.g., `refactor/simplify-navigation`)

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(webmcp): add form agent for automated form handling
fix(cart): correct quantity calculation for bulk items
docs(readme): add Docker setup instructions
test(e2e): add accessibility tests for navigation
```

## Testing

### Running Tests

```bash
# Run all Maven tests
mvn test

# Run Playwright E2E tests
cd playwright-tests
npm install
npm test

# Run specific test suites
npm run test:core        # Core WebMCP tests
npm run test:forms       # Form handling tests
npm run test:security    # Security tests
npm run test:accessibility  # Accessibility tests
npm run test:performance    # Performance tests
```

### Running Tests with Docker

```bash
# Start mock AEM and run tests
docker-compose --profile test up --abort-on-container-exit
```

### Writing Tests

- Place unit tests alongside source files or in `src/test/java`
- Place E2E tests in `playwright-tests/tests/`
- Follow existing test patterns and naming conventions
- Ensure tests are deterministic and don't depend on external state

### Test Coverage

- Aim for 80%+ code coverage on new code
- All new features must include tests
- All bug fixes should include a regression test

## Pull Request Process

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and commit following the commit message format

3. **Update documentation** if needed

4. **Run tests** locally to ensure they pass:
   ```bash
   mvn test
   npm test --prefix playwright-tests
   ```

5. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** with:
   - Clear description of changes
   - Link to related issues
   - Screenshots for UI changes
   - Test results/coverage report

7. **Address review feedback** and update as needed

### PR Requirements

- [ ] Tests pass
- [ ] Code follows project style guidelines
- [ ] Documentation updated (if applicable)
- [ ] No merge conflicts with main
- [ ] PR description explains the changes

## Coding Standards

### Java

- Follow [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
- Use meaningful variable/method names
- Add Javadoc for public methods
- Keep methods under 50 lines when possible

### JavaScript/TypeScript

- Use ES6+ features
- Follow ESLint configuration
- Use TypeScript for new code when possible
- Document complex logic with comments

### CSS/SCSS

- Follow BEM naming convention
- Use CSS variables for theming
- Ensure responsive design
- Support RTL layouts

### HTML/HTL

- Use semantic HTML5 elements
- Ensure accessibility (ARIA labels, roles)
- Follow AEM HTL best practices

## Component Development

### Creating New Components

1. Use the AEM Project Archetype structure
2. Place component in `ui.apps/src/main/content/jcr_root/apps/aem-webmcp/components/`
3. Include:
   - `.content.xml` - Component definition
   - `_cq_dialog/.content.xml` - Author dialog
   - `_cq_editConfig.xml` - Edit configuration
   - Component HTL file
   - Client libraries if needed

### WebMCP Integration

When adding WebMCP support to components:

1. Add appropriate data attributes for component detection
2. Implement any required JavaScript enhancements
3. Add Playwright tests for the component
4. Update documentation with usage examples

## Documentation

- Update README.md for significant changes
- Add JSDoc/Javadoc for new public APIs
- Include code examples in documentation
- Update CHANGELOG.md for releases

## Questions?

- Open an issue for questions
- Join discussions in GitHub Discussions
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the project's license.

---

Thank you for contributing to AEM WebMCP! 🎉
