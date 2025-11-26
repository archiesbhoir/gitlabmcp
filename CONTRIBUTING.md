# Contributing to GitLab MCP

Thank you for your interest in contributing to GitLab MCP! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the maintainers.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- A GitLab instance (or GitLab.com) for testing

### Development Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/your-username/gitlabmcp.git
   cd gitlabmcp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file:**
   ```bash
   cp .env.example .env  # If available, or create manually
   ```

   Add your GitLab configuration:
   ```bash
   GITLAB_BASE_URL=https://gitlab.com
   GITLAB_TOKEN=your_token_here
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

5. **Run tests:**
   ```bash
   npm test
   ```

## Development Workflow

### Making Changes

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes:**
   - Write clean, readable code
   - Follow existing code style (TypeScript, ESLint/Prettier)
   - Add tests for new features
   - Update documentation as needed

3. **Test your changes:**
   ```bash
   npm run build
   npm test
   npm run lint
   ```

4. **Commit your changes:**
   - Write clear, descriptive commit messages
   - Use conventional commit format when possible:
     - `feat: add new feature`
     - `fix: resolve bug`
     - `docs: update documentation`
     - `test: add tests`
     - `refactor: improve code structure`

5. **Push and create a Pull Request:**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style

- **TypeScript:** Follow TypeScript best practices
- **Formatting:** Use Prettier (run `npm run format`)
- **Linting:** Use ESLint (run `npm run lint`)
- **Type Safety:** Ensure `npm run typecheck` passes

### Testing

- Write unit tests for new features
- Write integration tests for API interactions
- Ensure all tests pass before submitting PR
- Aim for good test coverage

### Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for new functions/classes
- Update examples if API changes
- Keep CHANGELOG.md updated (if applicable)

## Pull Request Process

1. **Before submitting:**
   - Ensure all tests pass
   - Run linter and formatter
   - Update documentation
   - Rebase on latest main branch

2. **PR description should include:**
   - What changes were made
   - Why the changes were needed
   - How to test the changes
   - Any breaking changes

3. **Review process:**
   - Maintainers will review your PR
   - Address feedback promptly
   - Keep PR focused on a single feature/fix

## Good First Issues

Look for issues labeled `good-first-issue` if you're new to the project. These are typically:
- Documentation improvements
- Small bug fixes
- Test additions
- Example improvements

## Reporting Bugs

When reporting bugs, please include:

- **Description:** Clear description of the bug
- **Steps to reproduce:** Detailed steps to reproduce
- **Expected behavior:** What should happen
- **Actual behavior:** What actually happens
- **Environment:** Node.js version, OS, GitLab version
- **Logs:** Relevant error messages or logs

## Feature Requests

For feature requests:

- Check if the feature already exists or is planned
- Describe the use case clearly
- Explain why it would be valuable
- Consider implementation complexity

## Questions?

- Open an issue for questions
- Check existing issues and discussions
- Review the README for common questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

