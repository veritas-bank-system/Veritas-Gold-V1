# Rust Business Application AI Rules Library

> **Purpose:** A 40-page, original, UI-ready Rust engineering library for AI coding agents and developers building reliable business applications. Use these rules when designing new Rust services or rewriting Java and Kotlin functions into idiomatic Rust.
>
> **Reference foundation:** [The Rust Programming Language](https://doc.rust-lang.org/book/)
>
> **Core objective:** Build clear, safe, testable, maintainable Rust applications with explicit data models, predictable errors, secure boundaries, and production-ready operations.

---

# Page 01 — AI Operating Contract

Generate production-oriented, idiomatic Rust for business applications. Preserve the required business behavior while redesigning the implementation around Rust ownership, types, errors, modules, and composition.

## Mandatory rules

- Do not translate Java or Kotlin line by line.
- Preserve API contracts, validation, authorization, money rules, state transitions, audit requirements, and idempotency behavior.
- Prefer explicit types, small functions, pure domain logic, and dependency injection through traits or application state.
- Do not use `unsafe` unless there is a documented technical requirement and a human reviewer approves it.
- Do not use `unwrap()` or `expect()` in request handling, background jobs, integrations, imports, or other production paths.
- Ask for missing requirements instead of inventing security, financial, or business rules.

---

# Page 02 — Rust Application Principles

Rust provides native performance, predictable resource cleanup, and compile-time memory safety without a garbage collector. Use those strengths to create business software that is simple to operate and difficult to misuse.

## Design priorities

- Correctness before cleverness
- Clear domain naming before generic abstractions
- Explicit errors before hidden failures
- Bounded resources before unlimited queues or memory growth
- Tests for business behavior before framework-heavy tests
- Stable interfaces before implementation convenience

Use Cargo as the standard build, test, dependency, formatting, linting, and documentation tool.

---

# Page 03 — Java/Kotlin Migration Principles

Java and Kotlin code often assumes garbage collection, nullable references, exceptions, inheritance, mutable services, annotations, and framework-managed state. Rust uses ownership, `Option`, `Result`, traits, composition, and explicit dependencies.

## Migration rules

- Convert nullable values to `Option<T>`.
- Convert exceptions to `Result<T, E>`.
- Convert sealed classes to enums.
- Replace inheritance with composition and traits.
- Replace singleton services with injected application dependencies.
- Separate API DTOs, database rows, and domain entities.
- Move business rules out of controllers, ORM callbacks, and framework annotations into domain methods.

---

# Page 04 — Workspace Layout

Use a Cargo workspace when the application has multiple services, reusable libraries, workers, or command-line tools.

```text
business-platform/
├── Cargo.toml
├── crates/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   ├── api/
│   ├── worker/
│   └── shared-testkit/
├── migrations/
├── docs/
└── deploy/
```

## Layer rules

- `domain`: pure business entities, value objects, state transitions, and domain errors
- `application`: use cases, transactions, orchestration, authorization checks, ports
- `infrastructure`: database, email, queues, object storage, HTTP clients, external services
- `api`: routing, request parsing, response mapping, authentication boundary
- `worker`: scheduled jobs, imports, queue consumers, maintenance tasks

The domain crate must not depend on HTTP frameworks, ORM code, database drivers, or vendor SDKs.

---

# Page 05 — Cargo and Dependencies

Cargo manages builds, dependencies, workspaces, tests, documentation, and release artifacts. Keep dependencies limited, actively maintained, and justified by a real requirement.

```toml
[workspace.dependencies]
serde = { version = "1", features = ["derive"] }
tokio = { version = "1", features = ["rt-multi-thread", "macros"] }
thiserror = "2"
tracing = "0.1"
```

## Rules

- Define shared dependency versions in the workspace root.
- Commit `Cargo.lock` for applications and services.
- Use feature flags to make optional capabilities explicit.
- Review new dependencies for security, maintenance, license, size, and transitive dependencies.
- Prefer standard-library solutions for small tasks.
- Update dependencies regularly through a tested maintenance process.

---

# Page 06 — Ownership Rules

Every Rust value has one owner. When the owner leaves scope, the value is cleaned up automatically. Assigning a non-`Copy` value or passing it by value generally moves ownership.

```rust
fn create_label(order_number: String) -> String {
    format!("ORDER-{order_number}")
}
```

## AI rules

- Use `&str` for read-only string inputs.
- Use `&T` for read-only access to structured values.
- Use `&mut T` only for intentional local mutation.
- Return owned values from constructors and transformations.
- Clone only where separate ownership is required.
- Review repeated `.clone()` calls in hot paths or large collections.

---

# Page 07 — Borrowing and Lifetimes

Borrowing lets code read or modify a value without transferring ownership. Rust allows many immutable references or one mutable reference at a time.

```rust
fn normalize_email(input: &str) -> String {
    input.trim().to_ascii_lowercase()
}
```

## Rules

- Let Rust infer lifetimes whenever possible.
- Add lifetime annotations only when returning references tied to input references.
- Do not use `'static` only to bypass a compiler error.
- Return an owned value when borrowing makes an API difficult to use safely.
- Do not hold references into mutable data across `.await` points.

---

# Page 08 — Domain Value Types

Use dedicated types for business concepts instead of passing raw strings and integers everywhere. Newtypes and constructors reduce invalid data and make functions self-documenting.

```rust
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct CustomerId(pub uuid::Uuid);

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmailAddress(String);

impl EmailAddress {
    pub fn parse(value: impl Into<String>) -> Result<Self, DomainError> {
        let value = value.into().trim().to_ascii_lowercase();
        if !value.contains('@') {
            return Err(DomainError::InvalidEmailAddress);
        }
        Ok(Self(value))
    }
}
```

## Rules

- Parse and validate at construction boundaries.
- Use enums for finite choices and workflow states.
- Keep inner fields private when public access would bypass validation.
- Do not use empty strings, `-1`, or `0` as a substitute for missing values.

---

# Page 09 — Money and Numeric Precision

Financial values require exact, documented behavior. Never use `f32` or `f64` for money, tax, discounts, exchange rates, or accounting totals.

```rust
use rust_decimal::Decimal;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Money {
    pub amount: Decimal,
    pub currency: Currency,
}
```

## Rules

- Store money as integer minor units or fixed-point decimals.
- Include currency in the data model where more than one currency is possible.
- Define rounding mode, tax calculation sequence, discount rules, and conversion timestamp.
- Do not add or compare values from different currencies without explicit conversion.
- Preserve original price, calculated amount, and calculation rule version for auditable documents.

---

# Page 10 — Structs and Domain Entities

Structs are the primary representation for named data. Use them for entities, commands, configuration, value objects, and responses.

```rust
pub struct Invoice {
    id: InvoiceId,
    customer_id: CustomerId,
    lines: Vec<InvoiceLine>,
    status: InvoiceStatus,
}
```

## Rules

- Keep invariant-sensitive fields private.
- Create entities through validated constructors or factory methods.
- Expose focused behavior such as `add_line`, `issue`, or `cancel`, not generic setter methods.
- Derive traits only when they are necessary; do not automatically derive `Clone` for every entity.
- Avoid giant structs that combine data from unrelated business capabilities.

---

# Page 11 — Enums and State Machines

Enums model values that can be one of a fixed set of states. Use them for lifecycle transitions, payment outcomes, roles, validation results, and command status.

```rust
pub enum InvoiceStatus {
    Draft,
    Issued { issued_at: chrono::DateTime<chrono::Utc> },
    Paid { paid_at: chrono::DateTime<chrono::Utc> },
    Cancelled { reason: String },
}
```

## Rules

- Keep transition logic in entity methods or dedicated domain services.
- Match exhaustively on business-critical enums.
- Carry status-specific data in variants rather than scattered optional fields.
- Separate retryable failures from final cancellations or rejections.
- Persist transition timestamp, actor, and reason when audit requirements apply.

---

# Page 12 — Pattern Matching

Use `match` to handle enums and cases that require complete coverage. Use `if let` only when one successful pattern is the clear focus.

```rust
match invoice.status {
    InvoiceStatus::Draft => invoice.issue()?,
    InvoiceStatus::Issued { .. } => return Err(DomainError::AlreadyIssued),
    InvoiceStatus::Paid { .. } => return Err(DomainError::AlreadyPaid),
    InvoiceStatus::Cancelled { .. } => return Err(DomainError::CancelledInvoice),
}
```

## Rules

- Avoid `_` fallback branches for critical domain state.
- Match on error variants when recovery differs.
- Use destructuring to make branch-specific data explicit.
- Keep substantial business logic in named methods rather than deeply nested matches.

---

# Page 13 — Modules and Visibility

Rust modules organize code and provide privacy boundaries. Items are private by default; make an item public only when another module must use it.

```rust
pub mod invoice;
mod tax;
mod validation;
```

## Rules

- Treat `pub` as a long-term API commitment.
- Expose a small, deliberate public interface from each module.
- Do not export database rows, API DTOs, or third-party types through domain APIs.
- Name modules after business capabilities such as `catalog`, `orders`, `pricing`, or `fulfillment`.
- Avoid broad glob imports in production modules.

---

# Page 14 — Traits and Application Ports

Traits define behavior contracts and enable dependency inversion. Use traits for database repositories, email delivery, storage, payment gateways, clocks, and message publishers.

```rust
#[async_trait::async_trait]
pub trait InvoiceRepository: Send + Sync {
    async fn find(&self, id: &InvoiceId) -> Result<Option<Invoice>, RepositoryError>;
    async fn save(&self, invoice: &Invoice) -> Result<(), RepositoryError>;
}
```

## Rules

- Keep traits small and focused on one capability.
- Define a trait close to the code that needs it.
- Use `Send + Sync` for dependencies stored in multithreaded application state.
- Prefer composition over broad service interfaces.
- Do not build a large generic framework before real use cases require it.

---

# Page 15 — Generics

Generics provide reusable functions and types while preserving compile-time safety. Use them when the same algorithm applies to multiple types.

```rust
pub struct Page<T> {
    pub items: Vec<T>,
    pub total: u64,
    pub page: u32,
    pub page_size: u32,
}
```

## Rules

- Start with concrete types in domain logic.
- Add generic parameters only when they remove meaningful duplication.
- Use minimal trait bounds.
- Keep public generic APIs understandable to application developers.
- Avoid using generic abstractions merely to imitate Java enterprise frameworks.

---

# Page 16 — Result and Error Architecture

Use `Result<T, E>` for any operation that can fail. Define typed error variants for expected domain failures and infrastructure failures that need distinct handling.

```rust
#[derive(Debug, thiserror::Error)]
pub enum DomainError {
    #[error("invoice is not in a state that can be issued")]
    InvalidInvoiceTransition,
    #[error("line quantity must be greater than zero")]
    InvalidQuantity,
    #[error("email address is invalid")]
    InvalidEmailAddress,
}
```

## Rules

- Use typed errors for business rule violations.
- Add context when crossing I/O and application boundaries.
- Map internal errors to stable client-safe error responses.
- Do not leak SQL, tokens, internal stack traces, or credentials to clients.
- Use `anyhow` only in binary/application boundaries where callers do not need to classify every failure.

---

# Page 17 — No-Panic Production Policy

A panic is not a normal error response. It can terminate work unexpectedly and makes recovery difficult in request handling and business processing.

## Rules

- Prohibit `unwrap()` and `expect()` in production execution paths.
- Prohibit unchecked collection indexing with externally influenced indices.
- Use `?`, `ok_or`, `ok_or_else`, `map_err`, and explicit matches.
- Allow `unwrap()` in tests, prototypes, or guaranteed startup constants only when failure is intentionally fatal.
- Treat production panics as bugs that require test coverage and a corrective fix.

---

# Page 18 — Async Rust and Tokio

Use asynchronous Rust for I/O-bound work such as HTTP requests, database queries, queues, timers, file access, and external service calls. Tokio is a common async runtime.

```rust
pub async fn find_invoice(
    repository: &dyn InvoiceRepository,
    id: &InvoiceId,
) -> Result<Invoice, AppError> {
    repository.find(id).await?
        .ok_or(AppError::InvoiceNotFound)
}
```

## Rules

- Use async for concurrent I/O, not automatically for every function.
- Do not execute blocking work on Tokio worker threads.
- Use `spawn_blocking` or worker processes for CPU-heavy, legacy blocking, or large-file work.
- Apply timeouts to every remote dependency.
- Bound concurrency when processing batches or external requests.

---

# Page 19 — Shared State

Application state should hold long-lived dependencies such as configuration, connection pools, repositories, and service clients. Use `Arc` for intentionally shared ownership.

```rust
use std::sync::Arc;

pub struct AppState {
    pub invoice_repository: Arc<dyn InvoiceRepository>,
    pub notification_service: Arc<dyn NotificationService>,
}
```

## Rules

- Prefer immutable shared dependencies.
- Avoid global mutable singletons.
- Do not hold a mutex lock across `.await`.
- Use durable storage rather than in-memory maps for business-critical coordination.
- Keep locks small, local, and time-bounded if they are truly needed.

---

# Page 20 — HTTP API Design

HTTP handlers should parse requests, establish caller context, validate input shape, call application use cases, and return stable responses. Business logic belongs outside the routing layer.

```rust
async fn create_invoice(
    State(state): State<AppState>,
    Json(request): Json<CreateInvoiceRequest>,
) -> Result<(StatusCode, Json<InvoiceResponse>), ApiError> {
    let response = state.invoice_service.create(request.try_into()?).await?;
    Ok((StatusCode::CREATED, Json(response.into())))
}
```

## Rules

- Keep request and response DTOs separate from domain types.
- Use correct HTTP status codes and consistent machine-readable error codes.
- Authenticate and authorize before state-changing operations.
- Limit request body size and apply timeouts.
- Never return raw internal error messages directly to API users.

---

# Page 21 — DTO and Domain Mapping

External API objects, persistence records, and internal domain entities change for different reasons. Map among them explicitly.

```rust
#[derive(serde::Deserialize)]
pub struct CreateCustomerRequest {
    pub email: String,
    pub display_name: String,
}

impl TryFrom<CreateCustomerRequest> for CreateCustomerCommand {
    type Error = ApiError;

    fn try_from(value: CreateCustomerRequest) -> Result<Self, Self::Error> {
        Ok(Self {
            email: EmailAddress::parse(value.email)?,
            display_name: value.display_name.trim().to_owned(),
        })
    }
}
```

## Rules

- Make conversion fallible for user input.
- Normalize and validate data once at the boundary.
- Do not deserialize directly into complex entities with hidden invariants.
- Version public contracts deliberately.
- Avoid exposing database field names as public API by accident.

---

# Page 22 — PostgreSQL and SQLx

Use PostgreSQL for durable business data, relational integrity, audit trails, idempotency records, and transactional workflows. Use SQLx or a similarly explicit data-access approach.

```rust
let row = sqlx::query_as::<_, InvoiceRow>(
    "SELECT id, customer_id, status FROM invoices WHERE id = $1"
)
.bind(invoice_id.0)
.fetch_optional(&pool)
.await?;
```

## Rules

- Use parameterized SQL only.
- Keep SQL in repository or infrastructure modules.
- Add indexes based on actual query patterns.
- Use UTC timestamps in storage.
- Enforce essential integrity with foreign keys, uniqueness constraints, and check constraints.
- Review migrations as carefully as application code.

---

# Page 23 — Transactions and Idempotency

Requests can be retried due to timeouts, client behavior, queue delivery, or operator actions. Build state-changing operations so a repeated request does not create duplicate invoices, payments, stock movements, or emails.

## Rules

- Require an idempotency key for externally initiated critical commands.
- Store the key, request fingerprint, outcome, and status durably.
- Use unique database constraints to enforce deduplication.
- Perform related business changes in one transaction.
- Treat timeout outcomes as unknown until reconciled; do not assume an external action failed.
- Define a clear retry policy for each integration.

---

# Page 24 — Outbox Pattern

The transactional outbox pattern reliably connects database changes to external events. Store an outbox record in the same transaction as the domain change, then publish it asynchronously.

```text
Transaction:
1. Update business entity
2. Write audit record
3. Write outbox event
4. Commit

Worker:
1. Claim pending event
2. Deliver it
3. Record success or retry schedule
```

## Rules

- Use outbox events for important email, webhook, queue, search-index, and integration events.
- Include an event ID, aggregate ID, event type, schema version, payload, timestamp, and correlation ID.
- Make consumers idempotent because delivery can occur more than once.
- Do not publish an event before its transaction commits.

---

# Page 25 — Background Workers

Background workers process scheduled jobs, imports, exports, notification delivery, reconciliation, and outbox events. They must be safe to restart and safe to run across multiple instances.

## Rules

- Persist work state and retry metadata durably.
- Use leases, locking, or queue semantics to prevent duplicate concurrent processing.
- Make every worker task idempotent.
- Set attempt limits, exponential backoff, and dead-letter or operator-review outcomes.
- Emit structured logs and metrics for job age, attempts, failures, and throughput.
- Do not keep critical work only in process memory.

---

# Page 26 — Authentication and Authorization

Authentication identifies the caller. Authorization confirms that the caller may perform the requested action on the requested business resource.

```rust
pub struct RequestContext {
    pub tenant_id: TenantId,
    pub actor_id: ActorId,
    pub roles: Vec<Role>,
    pub correlation_id: CorrelationId,
}
```

## Rules

- Derive tenant and actor identity from trusted credentials, not from editable request fields.
- Enforce authorization before reading or changing sensitive resources.
- Apply tenant scope to every query, mutation, event, audit log, and cache key.
- Use least privilege for users, services, database accounts, queues, and storage.
- Audit privileged actions and sensitive data access.

---

# Page 27 — Validation Strategy

Validation belongs at multiple layers. Each layer should enforce the rules it can reliably know.

- API layer: JSON shape, required fields, field size, syntax
- Domain layer: business invariants and valid state transitions
- Database layer: uniqueness, relationships, check constraints
- Integration layer: third-party schema and response verification

## Rules

- Never rely only on frontend validation.
- Return field-level errors for client-correctable input.
- Keep domain validation reusable across APIs, workers, imports, and command-line tools.
- Normalize input before comparison or storage.
- Use allowlists for finite accepted values where appropriate.

---

# Page 28 — Serialization and Events

Serde provides serialization and deserialization for JSON and other formats. Treat serialized forms as versioned contracts, especially for queues, webhooks, exports, and API responses.

```rust
#[derive(serde::Serialize, serde::Deserialize)]
pub struct InvoiceCreatedEventV1 {
    pub event_id: String,
    pub invoice_id: String,
    pub occurred_at: chrono::DateTime<chrono::Utc>,
}
```

## Rules

- Use explicit field naming and enum representation in public schemas.
- Do not serialize internal domain objects directly when their shape may change.
- Version externally stored or delivered events.
- Validate deserialized input before use.
- Avoid leaking secrets or internal attributes into serialized output.

---

# Page 29 — Testing Foundation

Test business behavior at the lowest useful level. Rust supports unit tests, integration tests, and documentation tests through Cargo.

```rust
#[test]
fn draft_invoice_can_be_issued() {
    let mut invoice = Invoice::draft(/* valid input */);
    invoice.issue().unwrap();
    assert!(matches!(invoice.status(), InvoiceStatus::Issued { .. }));
}
```

## Rules

- Unit-test value objects, calculations, permissions, and state transitions without infrastructure.
- Integration-test repositories, migrations, HTTP routes, queues, and external adapters.
- Use builders and fixtures with safe defaults.
- Test success, invalid input, authorization denial, retries, duplicates, and partial failures.
- Keep tests deterministic by injecting time, randomness, and external ports.

---

# Page 30 — Property and Fuzz Testing

Property tests generate many inputs to validate invariants. Fuzz tests explore unexpected input combinations and are especially valuable for parsers, imports, decoding, and API boundaries.

## Rules

- Use property tests for money calculations, tax, discounts, ordering, serialization, and state transitions.
- Fuzz CSV importers, JSON parsers, URL processing, file readers, and user-controlled identifiers.
- Assert that malformed input returns a controlled error rather than panic, excessive allocation, or infinite processing.
- Save minimized failures as regression tests.
- Run broader fuzzing on a scheduled CI job when runtime is expensive.

---

# Page 31 — Observability

Use structured logging, metrics, and traces to understand application behavior in production. The `tracing` ecosystem supports contextual fields and async-aware instrumentation.

```rust
#[tracing::instrument(skip(service), fields(invoice_id = %invoice_id, tenant_id = %context.tenant_id))]
async fn issue_invoice(/* ... */) -> Result<(), AppError> {
    Ok(())
}
```

## Rules

- Include correlation ID, tenant ID, actor ID where appropriate, aggregate ID, job ID, and event ID.
- Never log passwords, access tokens, session data, payment details, or confidential personal data.
- Track latency, error rate, retries, queue age, throughput, saturation, and database pool usage.
- Provide health, readiness, and liveness endpoints with meaningful semantics.

---

# Page 32 — Configuration and Secrets

Read configuration at startup, parse it into typed structures, validate it, and fail before accepting traffic if critical values are missing or invalid.

```rust
pub struct Config {
    pub database_url: secrecy::SecretString,
    pub http_port: u16,
    pub environment: Environment,
}
```

## Rules

- Separate local, test, staging, and production configuration.
- Store secrets in a secret manager or secure deployment environment.
- Never commit production secrets, private `.env` files, or credential exports.
- Redact secret values from debug output and error messages.
- Make allowed origins, external URLs, feature flags, and storage locations explicit configuration.

---

# Page 33 — File, Import, and Export Safety

Business applications commonly process CSV, spreadsheets, PDFs, images, and supplier files. Treat every uploaded or imported file as untrusted input.

## Rules

- Set strict file-size, row-count, column-count, and processing-time limits.
- Validate MIME type and content structure; do not trust filename extensions alone.
- Store uploads outside executable directories.
- Stream large files rather than loading them fully into memory.
- Track source, uploader, hash, import result, rejected rows, and correlation ID.
- Make imports resumable and idempotent.
- Escape exported spreadsheet values to mitigate formula injection.

---

# Page 34 — Java/Kotlin to Rust Mapping

| Java/Kotlin concept | Rust-oriented approach |
|---|---|
| `null` or Kotlin nullable type | `Option<T>` |
| Checked or unchecked exception | `Result<T, E>` |
| Interface | Trait |
| Abstract class | Trait plus composition or enum |
| Inheritance | Composition, trait implementation, enum |
| `data class` | Struct with intentional derived traits |
| `sealed class` | Enum |
| `Optional<T>` | `Option<T>` |
| `CompletableFuture` or `suspend` | `async fn`, `Future`, Tokio |
| Singleton service | Explicit `AppState` or dependency injection |
| Global ORM entity | Domain entity plus DTO/persistence mapping |
| `BigDecimal` | `rust_decimal::Decimal` or integer minor units |
| `try/catch` | `Result`, `?`, explicit error mapping |

## Rule

Translate behavior and contracts, not JVM syntax or framework conventions.

---

# Page 35 — Function Rewrite Procedure

Rewrite each Java/Kotlin function from its contract outward.

1. List input types, output type, side effects, error cases, authorization needs, and retry/idempotency behavior.
2. Convert nullable values into `Option<T>`.
3. Convert thrown exceptions into a typed `Result<T, E>`.
4. Move domain decisions into a domain entity or domain service.
5. Inject database, HTTP, mail, storage, clock, and queue dependencies through application ports.
6. Write tests before or alongside the rewrite.

```rust
pub async fn approve_invoice(
    context: &RequestContext,
    invoice_id: InvoiceId,
    repository: &dyn InvoiceRepository,
) -> Result<Invoice, AppError> {
    let mut invoice = repository.find_for_tenant(&context.tenant_id, &invoice_id).await?
        .ok_or(AppError::InvoiceNotFound)?;
    invoice.approve(&context.actor_id)?;
    repository.save(&invoice).await?;
    Ok(invoice)
}
```

---

# Page 36 — Performance and Resource Limits

Measure before optimizing. Rust enables efficient applications, but correct algorithms, database design, network behavior, and resource limits determine real production reliability.

## Rules

- Avoid unnecessary allocations and cloning in frequent paths.
- Stream large inputs and outputs.
- Paginate list endpoints and prefer keyset pagination for very large ordered datasets.
- Bound connection pools, request bodies, task concurrency, queue size, cache size, and retry attempts.
- Batch database writes where business semantics permit it.
- Profile realistic workloads before introducing complex optimizations.

---

# Page 37 — Security Baseline

Memory safety does not replace application security. Secure Rust business applications through deliberate authentication, authorization, data handling, deployment, and operational controls.

## Rules

- Use TLS for all external communication.
- Parameterize database queries and validate all external input.
- Apply request limits, timeouts, rate limits, and concurrency limits.
- Use a mature password-hashing library when storing passwords.
- Enforce strict CORS and security headers for browser-facing services.
- Scan dependencies and secrets in CI.
- Patch runtime, operating system, and dependencies through a regular process.
- Define audit logging, backup, retention, and incident-response procedures.

---

# Page 38 — CI/CD Quality Gates

Every change must be formatted, linted, tested, built, and scanned before release.

```bash
cargo fmt --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
cargo build --workspace --release
```

## Rules

- Test migrations against an isolated database in CI.
- Run integration tests against controlled dependency instances.
- Review dependency lockfile changes.
- Build versioned immutable release artifacts.
- Use environment-specific deployment approvals.
- Keep rollback instructions and migration recovery procedures available.

---

# Page 39 — AI Code Review Checklist

Before accepting generated Rust, verify all of the following:

- The function has one clear responsibility.
- Inputs and outputs use meaningful types.
- Missing values use `Option<T>`.
- Fallible operations use `Result<T, E>`.
- No `unwrap`, `expect`, uncontrolled panic, or unreviewed `unsafe` exists in production code.
- Financial amounts avoid floating-point arithmetic.
- Authorization and tenant scope are verified before protected data access or mutation.
- Database changes use a transaction when consistency requires it.
- External calls include timeout, retry policy, and idempotency design.
- Logs contain useful structured context but no secrets.
- DTO, database, and domain boundaries remain separate.
- Tests cover normal, invalid, unauthorized, repeated, and dependency-failure cases.

---

# Page 40 — Production Release Gate

Do not deploy a Rust business service until data integrity, security, observability, and recovery have been verified.

## Mandatory release checks

- Build with `cargo build --release`.
- Validate staging configuration and runtime dependencies.
- Review, test, and back up database migrations.
- Test idempotency, transactions, worker retries, and outbox delivery.
- Inject secrets through an approved secrets-management process.
- Confirm monitoring, alerting, logs, metrics, traces, health checks, and runbooks.
- Test rollback, restore, reconciliation, and incident-response procedures.
- Confirm authorization rules and audit logging for privileged actions.
- Record version, deployment time, operator, configuration version, and migration version.

---

# Official Rust Reference

- [The Rust Programming Language](https://doc.rust-lang.org/book/)
- [Rust Documentation Index](https://doc.rust-lang.org/stable/)
- [Rust Standard Library](https://doc.rust-lang.org/std/)
- [Cargo Book](https://doc.rust-lang.org/cargo/)
