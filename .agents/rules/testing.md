# Testing & Testability Rules

## 1. Test Integrity (Zero Cheating / No Fake Passes)
- NEVER write tests solely to achieve passing checkmarks (e.g. asserting trivial conditions like `expect(true).toBe(true)`, or mocking the function under test).
- Tests must assert genuine, domain-specific behavior, edge cases, error codes, and business invariants.
- If a test fails, you MUST fix the underlying implementation. NEVER alter test assertions or lower testing standards simply to force a green test, unless business requirements have genuinely changed.
- Tests MUST fail when underlying logic is broken or produces incorrect outputs.

## 2. Design for Testability
- **Dependency Injection (DI)**: Classes and factory functions must accept their dependencies (e.g. database pool, LLM client, session store) via constructors or arguments instead of accessing hidden global singletons.
- **Pure Functions**: Extract pure business logic, input sanitizers, SQL cleaners, JSON extractors, and formatting helpers into separate pure functions for isolated, deterministic unit testing.
- **Clear Interfaces**: Keep interfaces modular so test mocks can faithfully mimic external API errors (e.g. database timeouts, 429 quota exhaustion, invalid SQL syntax).

## 3. Test Suites
- **Unit Tests**: Fast, in-memory testing of config parsing, prompt generation, error handling, session management, retry logic, and safety guardrails.
- **Integration Tests**: Real database execution testing against the PostgreSQL container to ensure read-only permissions and table schema consistency.
