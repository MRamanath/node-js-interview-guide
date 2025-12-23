# 25. Creating & Publishing NPM Packages

## 📚 Overview

Learn how to create, publish, and maintain NPM packages. This covers both public packages (open source) and private packages (for organizations), including package configuration, versioning, documentation, and best practices.

## 🎯 Key Concepts

### Package Types

```
Public Package:
- Free to publish
- Anyone can install
- Open source
- Listed on npmjs.com

Private Package:
- Requires paid npm account or GitHub Packages
- Restricted access
- Organization/team use
- Scoped packages (@org/package)
```

### Package Structure

```
my-package/
├── package.json          # Package metadata
├── README.md            # Documentation
├── LICENSE              # License file
├── .gitignore          # Git ignore
├── .npmignore          # NPM ignore
├── src/                # Source code
│   └── index.js
├── dist/               # Built files
├── test/               # Tests
└── examples/           # Usage examples
```

## 💻 Examples

### Creating a Simple Package

```bash
# Create project directory
mkdir my-awesome-package
cd my-awesome-package

# Initialize package
npm init

# Follow prompts or use defaults
npm init -y
```

### Package.json Configuration

```json
{
  "name": "my-awesome-package",
  "version": "1.0.0",
  "description": "A utility library for awesome things",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "rollup -c",
    "test": "jest",
    "prepublishOnly": "npm test && npm run build"
  },
  "keywords": [
    "utility",
    "helper",
    "awesome"
  ],
  "author": "Your Name <email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/username/my-awesome-package.git"
  },
  "bugs": {
    "url": "https://github.com/username/my-awesome-package/issues"
  },
  "homepage": "https://github.com/username/my-awesome-package#readme",
  "engines": {
    "node": ">=14.0.0"
  },
  "peerDependencies": {
    "react": "^18.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "rollup": "^3.0.0"
  }
}
```

### Simple Utility Package

```javascript
// src/index.js

/**
 * Capitalize first letter of a string
 * @param {string} str - Input string
 * @returns {string} Capitalized string
 */
function capitalize(str) {
  if (typeof str !== 'string') {
    throw new TypeError('Expected a string');
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate random integer between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export functions
module.exports = {
  capitalize,
  randomInt,
  debounce
};

// ES Module export
export { capitalize, randomInt, debounce };
```

### Adding Tests

```javascript
// test/index.test.js
const { capitalize, randomInt, debounce } = require('../src/index');

describe('capitalize', () => {
  test('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });
  
  test('handles empty string', () => {
    expect(capitalize('')).toBe('');
  });
  
  test('throws on non-string', () => {
    expect(() => capitalize(123)).toThrow(TypeError);
  });
});

describe('randomInt', () => {
  test('returns number in range', () => {
    const result = randomInt(1, 10);
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(10);
  });
});

describe('debounce', () => {
  jest.useFakeTimers();
  
  test('delays function execution', () => {
    const func = jest.fn();
    const debounced = debounce(func, 1000);
    
    debounced();
    expect(func).not.toHaveBeenCalled();
    
    jest.runAllTimers();
    expect(func).toHaveBeenCalledTimes(1);
  });
});
```

### README Documentation

```markdown
# My Awesome Package

> A collection of awesome utility functions

## Installation

```bash
npm install my-awesome-package
```

## Usage

```javascript
const { capitalize, randomInt, debounce } = require('my-awesome-package');

// Capitalize strings
console.log(capitalize('hello')); // 'Hello'

// Generate random integers
const dice = randomInt(1, 6);

// Debounce function calls
const search = debounce((query) => {
  console.log('Searching for:', query);
}, 300);
```

## API

### capitalize(str)

Capitalizes the first letter of a string.

**Parameters:**
- `str` (string): Input string

**Returns:** string

### randomInt(min, max)

Generates a random integer between min and max (inclusive).

**Parameters:**
- `min` (number): Minimum value
- `max` (number): Maximum value

**Returns:** number

### debounce(func, wait)

Creates a debounced function that delays invoking func.

**Parameters:**
- `func` (Function): The function to debounce
- `wait` (number): Milliseconds to delay

**Returns:** Function

## License

MIT © Your Name
```

### Publishing Public Package

```bash
# 1. Create npm account (if needed)
npm adduser

# 2. Login to npm
npm login

# 3. Test package locally
npm link
cd ~/other-project
npm link my-awesome-package

# 4. Verify package contents
npm pack --dry-run

# 5. Publish to npm
npm publish

# 6. Publish with tag
npm publish --tag beta

# 7. Update version and publish
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
npm publish
```

### Creating Scoped Package

```json
// package.json
{
  "name": "@username/my-package",
  "version": "1.0.0",
  "description": "My scoped package"
}
```

```bash
# Publish scoped package as public
npm publish --access public

# Publish as private (requires paid account)
npm publish --access restricted
```

### Private Package with NPM

```bash
# Login with npm account
npm login

# Create private scoped package
{
  "name": "@myorg/private-package",
  "version": "1.0.0",
  "private": true
}

# Publish private package
npm publish

# Install private package (team members)
npm install @myorg/private-package
```

### Private Package with GitHub Packages

```bash
# 1. Create .npmrc in project root
echo "@myorg:registry=https://npm.pkg.github.com" > .npmrc

# 2. Authenticate
npm login --scope=@myorg --registry=https://npm.pkg.github.com

# 3. Update package.json
{
  "name": "@myorg/my-package",
  "version": "1.0.0",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/myorg/my-package.git"
  }
}

# 4. Publish
npm publish
```

### Using Private Package

```bash
# Create .npmrc in consuming project
@myorg:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}

# Or use npm.pkg.github.com for scoped packages
echo "@myorg:registry=https://npm.pkg.github.com" >> .npmrc

# Install
npm install @myorg/my-package
```

### .gitignore

```gitignore
# Dependencies
node_modules/

# Build outputs
dist/
*.log

# Coverage
coverage/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Env files
.env
.env.local
```

### .npmignore

```gitignore
# Source files
src/
test/
examples/

# Config files
.eslintrc.js
.prettierrc
rollup.config.js
jest.config.js

# Documentation
docs/

# CI
.github/
.travis.yml

# Development files
*.test.js
*.spec.js
```

### TypeScript Package

```typescript
// src/index.ts
export function greet(name: string): string {
  return `Hello, ${name}!`;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export class ApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    return response.json();
  }
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

```json
// package.json
{
  "name": "@myorg/ts-package",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

### Semantic Versioning

```bash
# Version format: MAJOR.MINOR.PATCH

# Patch: Bug fixes (1.0.0 -> 1.0.1)
npm version patch

# Minor: New features, backward compatible (1.0.0 -> 1.1.0)
npm version minor

# Major: Breaking changes (1.0.0 -> 2.0.0)
npm version major

# Prerelease versions
npm version prepatch  # 1.0.0 -> 1.0.1-0
npm version preminor  # 1.0.0 -> 1.1.0-0
npm version premajor  # 1.0.0 -> 2.0.0-0
npm version prerelease # 1.0.0-0 -> 1.0.0-1

# Custom version
npm version 1.2.3
```

### Package with CLI

```javascript
// bin/cli.js
#!/usr/bin/env node

const { program } = require('commander');
const { greet } = require('../src/index');

program
  .version('1.0.0')
  .description('My awesome CLI tool');

program
  .command('greet <name>')
  .description('Greet someone')
  .action((name) => {
    console.log(greet(name));
  });

program.parse(process.argv);
```

```json
// package.json
{
  "name": "my-cli-tool",
  "version": "1.0.0",
  "bin": {
    "my-tool": "./bin/cli.js"
  },
  "dependencies": {
    "commander": "^11.0.0"
  }
}
```

```bash
# Install globally
npm install -g my-cli-tool

# Use CLI
my-tool greet John
```

### Monorepo with Multiple Packages

```json
// package.json (root)
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": [
    "packages/*"
  ]
}

// packages/package-a/package.json
{
  "name": "@myorg/package-a",
  "version": "1.0.0"
}

// packages/package-b/package.json
{
  "name": "@myorg/package-b",
  "version": "1.0.0",
  "dependencies": {
    "@myorg/package-a": "^1.0.0"
  }
}
```

```bash
# Install all dependencies
npm install

# Publish all packages
npm publish --workspaces
```

### Package Scripts

```json
{
  "scripts": {
    "prepare": "npm run build",
    "prepublishOnly": "npm test && npm run lint",
    "preversion": "npm test",
    "version": "npm run build && git add -A",
    "postversion": "git push && git push --tags",
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.js",
    "format": "prettier --write \"src/**/*.js\""
  }
}
```

### Deprecating a Package

```bash
# Deprecate specific version
npm deprecate my-package@1.0.0 "This version has security issues"

# Deprecate entire package
npm deprecate my-package "No longer maintained"

# Undeprecate
npm deprecate my-package@1.0.0 ""
```

### Unpublishing a Package

```bash
# Unpublish specific version (within 72 hours)
npm unpublish my-package@1.0.0

# Unpublish entire package (within 72 hours)
npm unpublish my-package --force

# Note: Unpublishing is discouraged, use deprecate instead
```

### Testing Package Locally

```bash
# Method 1: npm link
cd my-package
npm link

cd ../my-app
npm link my-package

# Method 2: Install from local path
npm install ../my-package

# Method 3: Use npm pack
cd my-package
npm pack  # Creates my-package-1.0.0.tgz

cd ../my-app
npm install ../my-package/my-package-1.0.0.tgz
```

### GitHub Actions for Publishing

```yaml
# .github/workflows/publish.yml
name: Publish Package

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - run: npm ci
      - run: npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Package with Peer Dependencies

```json
{
  "name": "react-awesome-plugin",
  "version": "1.0.0",
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "peerDependenciesMeta": {
    "react-dom": {
      "optional": true
    }
  }
}
```

## 🎤 Interview Questions

### Q1: What is the difference between dependencies and devDependencies?
**Answer:**
- **dependencies**: Required for package to run in production
- **devDependencies**: Only needed for development (testing, building)

```json
{
  "dependencies": {
    "express": "^4.18.0"  // Needed in production
  },
  "devDependencies": {
    "jest": "^29.0.0"     // Only for testing
  }
}
```

### Q2: What is semantic versioning?
**Answer:** Version format: `MAJOR.MINOR.PATCH`
- **MAJOR**: Breaking changes (1.0.0 → 2.0.0)
- **MINOR**: New features, backward compatible (1.0.0 → 1.1.0)
- **PATCH**: Bug fixes (1.0.0 → 1.0.1)

### Q3: What is a scoped package?
**Answer:** Package name prefixed with scope (@username/package). Used for organization packages or private packages. Can be public or private.

### Q4: What is the difference between public and private packages?
**Answer:**
- **Public**: Free, anyone can install, listed on npmjs.com
- **Private**: Requires paid npm account or GitHub Packages, restricted access

### Q5: What files should be included in published package?
**Answer:** Use `files` field in package.json to specify:
```json
{
  "files": ["dist", "README.md", "LICENSE"]
}
```
Exclude source files, tests, development configs.

### Q6: What is prepublishOnly script?
**Answer:** Runs before publishing package. Use for final tests and builds:
```json
{
  "scripts": {
    "prepublishOnly": "npm test && npm run build"
  }
}
```

### Q7: How to test package before publishing?
**Answer:** Use `npm link` to create symlink, `npm pack` to create tarball, or install from local path.

### Q8: What are peer dependencies?
**Answer:** Dependencies that package expects the consumer to have. Common in plugins (e.g., React plugins expect React to be installed).

### Q9: How to deprecate a package version?
**Answer:**
```bash
npm deprecate my-package@1.0.0 "Deprecation message"
```
Preferred over unpublishing for existing packages.

### Q10: What is the main field in package.json?
**Answer:** Entry point of package. Specifies which file is imported when package is required:
```json
{
  "main": "dist/index.js"
}
```

## 🎯 Best Practices

1. **Use semantic versioning**
   ```bash
   npm version patch  # Bug fixes
   npm version minor  # New features
   npm version major  # Breaking changes
   ```

2. **Add comprehensive README**
   ```markdown
   # Installation, Usage, API docs, Examples
   ```

3. **Include LICENSE file**
   ```text
   MIT, Apache-2.0, etc.
   ```

4. **Test before publishing**
   ```bash
   npm test && npm run build
   ```

5. **Use .npmignore**
   ```text
   Exclude unnecessary files from package
   ```

## 📚 Additional Resources

- [NPM Documentation](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [GitHub Packages](https://docs.github.com/en/packages)

---

[← Previous: Deployment](./24-deployment.md) | [Home →](./README.md)
