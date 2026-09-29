# Rust Enterprise Blockchain AI Rules Library

> **Purpose:** This document is an original, UI-ready 40-page Rust engineering library for AI coding agents and developers building a business application or enterprise blockchain layer. It is informed by the scope of *The Rust Programming Language* but does not reproduce its text. Use it as a project-level rule set when rewriting Java or Kotlin services in Rust.
>
> **Primary source:** [The Rust Programming Language](https://doc.rust-lang.org/book/)
>
> **Operating principle:** Preserve business behavior first; redesign unsafe, mutable, blocking, or inheritance-heavy implementation details into idiomatic Rust.

---

# Page 01 — AI Operating Contract

## Objective

Generate production-oriented Rust for business, ledger, blockchain-adjacent, and integration services. Prefer explicit domain models, deterministic business rules, strong validation, and observable failure behavior.

## Rules

- Do not mechanically translate Java or Kotlin line by line.
- Preserve public behavior: API contracts, validation rules, authorization, money precision, status transitions, error semantics, and idempotency.
- Use Rust ownership, types, enums, traits, and modules to simplify the design.
- Never use `unsafe` unless the requirement cannot be met safely and a reviewer approves it.
- Do not use `unwrap()` or `expect()` in request paths, worker paths, ledger processing, or production integration code.
- Ask for missing contracts instead of inventing blockchain, financial, cryptographic, or authorization behavior.

## Default stack

- Async runtime: Tokio
- HTTP API: Axum
- Serialization: Serde and `serde_json`
- Database: SQLx with PostgreSQL
- Errors: `thiserror` for domain/library errors, `anyhow` only at application boundaries
- Logging and tracing: `tracing`, `tracing-subscriber`
- Validation: `validator` or explicit domain constructors
- Configuration: environment-driven typed configuration

---

# Page 02 — Migration Philosophy

## Java/Kotlin to Rust

Treat migration as a domain-preserving redesign. Java and Kotlin commonly rely on garbage collection, nullable references, exceptions, class inheritance, reflection, blocking threads, and framework-managed mutable state. Rust uses ownership, `Option`, `Result`, traits, composition, and explicit shared state.

## Rules

- Translate nullable fields to `Option<T>`, not magic values such as empty strings or zero IDs.
- Translate checked and unchecked exceptions into `Result<T, E>` with typed errors.
- Replace inheritance hierarchies with composition, enums, and traits.
- Replace mutable singleton services with explicitly injected state.
- Replace ORM entities that cross every layer with domain models plus persistence models.
- Make side effects visible at the service boundary: database, network, filesystem, queue, clock, randomness, and signing.

---

# Page 03 — Workspace Layout

## Recommended repository shape

Use a Cargo workspace for enterprise systems with multiple deployables and reusable business components.

```text
enterprise-platform/
├── Cargo.toml
├── crates/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   ├── api/
│   ├── worker/
│   ├── blockchain-adapter/
│   └── shared-testkit/
├── migrations/
├── docs/
└── deploy/
```

## Rules

- Put pure domain rules in `domain`; it must not depend on HTTP, SQLx, Axum, or blockchain SDKs.
- Put use cases and orchestration in `application`.
- Put database, messaging, blockchain RPC, and external API implementations in `infrastructure`.
- Put HTTP handlers and DTO conversion in `api`.
- Avoid circular dependencies between crates.

---

# Page 04 — Cargo Dependency Rules

## Dependency discipline

Cargo manages packages, builds, test commands, features, and lockfiles. Keep dependencies small, actively maintained, compatible with your Rust version, and justified by a business need.

```toml
[workspace.dependencies]
serde = { version = "1", features = ["derive"] }
tokio = { version = "1", features = ["rt-multi-thread", "macros"] }
thiserror = "2"
tracing = "0.1"
```

## Rules

- Prefer workspace-managed dependency versions.
- Commit `Cargo.lock` for applications and services.
- Use feature flags to avoid pulling optional capabilities into every binary.
- Audit new dependencies for license, maintenance, transitive risk, and feature footprint.
- Do not add a crate for a trivial function that standard Rust can implement safely.

---

# Page 05 — Ownership Rules

## Core model

Each value has one owner. Values move when assigned or passed by value unless their type implements `Copy`. Ownership makes resource cleanup deterministic and prevents accidental aliasing of mutable state.

```rust
fn process_order(order_id: String) -> String {
    format!("processed:{order_id}")
}
```

## AI rules

- Accept `&str` for read-only text input unless the function needs ownership.
- Accept `&T` for read-only borrowed domain values.
- Accept `&mut T` only when direct mutation is essential and local.
- Return owned values from transformations and constructors.
- Clone only when ownership transfer is necessary and explain the reason in code structure, not comments.
- Treat repeated cloning in hot paths as a performance review signal.

---

# Page 06 — Borrowing and Lifetimes

## Borrowing model

Many immutable references or one mutable reference may exist at a time. This prevents concurrent mutation and invalid references before the code runs.

```rust
fn normalize_sku(input: &str) -> String {
    input.trim().to_ascii_uppercase()
}
```

## Rules

- Let the compiler infer lifetimes whenever possible.
- Add explicit lifetime parameters only when returning a reference tied to input references.
- Do not use `'static` to silence lifetime errors unless the data truly lives for the process lifetime.
- Prefer an owned result if a returned reference would make the API difficult or fragile.
- Do not retain a reference across `.await` unless its validity and synchronization are intentionally designed.

---

# Page 07 — Domain Types

## Make invalid states harder to represent

Use newtypes, enums, and constructors instead of raw strings, integers, maps, or generic JSON for core business values.

```rust
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct OrderId(pub uuid::Uuid);

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Sku(String);

impl Sku {
    pub fn parse(value: impl Into<String>) -> Result<Self, DomainError> {
        let value = value.into().trim().to_ascii_uppercase();
        if value.is_empty() {
            return Err(DomainError::InvalidSku);
        }
        Ok(Self(value))
    }
}
```

## Rules

- Use `u64`, `i64`, `Decimal`, or dedicated types deliberately; never use `f64` for money.
- Use enums for finite states such as order status, ledger state, network, and authorization outcome.
- Keep parsing and validation at type boundaries.
- Do not expose raw inner values if doing so bypasses invariants.

---

# Page 08 — Money, Quantity, and Precision

## Financial correctness

Business applications require deterministic money and quantity rules. Binary floating point can create representation errors, so currency values must not use `f32` or `f64`.

```rust
use rust_decimal::Decimal;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Money {
    pub amount: Decimal,
    pub currency: Currency,
}
```

## Rules

- Store currency amounts as integer minor units or fixed-point decimal values.
- Carry ISO currency code with each money amount unless the bounded context guarantees one currency.
- Define rounding mode, tax ordering, discount ordering, and conversion-rate timestamp explicitly.
- Prevent arithmetic between incompatible currencies without an explicit conversion operation.
- Version calculation rules when historic orders must remain reproducible.

---

# Page 09 — Struct Design

## Prefer named data

Structs represent entities, value objects, command data, configuration, and query results. Named fields make business code easier to review and safer to evolve.

```rust
pub struct PurchaseOrder {
    pub id: OrderId,
    pub supplier_id: SupplierId,
    pub lines: Vec<PurchaseOrderLine>,
    pub status: PurchaseOrderStatus,
}
```

## Rules

- Keep fields private when external mutation could violate an invariant.
- Use constructor methods such as `new`, `draft`, or `from_command` to validate creation.
- Use focused methods (`submit`, `cancel`, `reserve_stock`) instead of exposing arbitrary setters.
- Derive only necessary traits; avoid automatic `Clone` for security-sensitive or expensive objects.

---

# Page 10 — Enum State Machines

## Model lifecycle explicitly

Enums are ideal for business workflow states and blockchain transaction lifecycle. They make unsupported state combinations visible in compiler errors.

```rust
pub enum SettlementState {
    Pending,
    Submitted { tx_hash: String },
    Confirmed { block_number: u64 },
    Failed { reason: String },
}
```

## Rules

- Use a method or transition function to validate state changes.
- Match exhaustively on states; do not use a default branch that hides new variants.
- Store workflow-specific data in the relevant variant.
- Separate retryable failure from terminal rejection.
- Record transition timestamps and correlation IDs outside or alongside the enum when required for auditability.

---

# Page 11 — Pattern Matching Rules

## Explicit branching

Use `match` for enums and cases where exhaustiveness matters. Use `if let` only when ignoring remaining variants is intentional.

```rust
match payment.status {
    PaymentStatus::Authorized => approve_order(payment)?,
    PaymentStatus::Declined { reason } => reject_order(reason)?,
    PaymentStatus::Pending => queue_for_review(payment)?,
}
```

## Rules

- Avoid wildcard (`_`) branches for critical domain enums.
- Bind fields directly in patterns instead of extracting values through repeated accessors.
- Use guards only for clear exceptional conditions; do not hide substantial business logic in pattern guards.
- Match errors by variant where recovery differs.

---

# Page 12 — Modules and Visibility

## Encapsulation

Rust modules provide namespace and privacy boundaries. Keep implementation details private by default and expose a small intentional public API.

```rust
pub mod order;
mod pricing;
mod validation;
```

## Rules

- Use `pub` sparingly; every public item becomes a compatibility obligation.
- Re-export only the domain-facing types consumers need.
- Avoid `pub use crate::*` style broad exports.
- Keep DTOs, repository row types, and vendor SDK types out of public domain APIs.
- Name modules by business capability, not technical patterns alone.

---

# Page 13 — Traits and Ports

## Composition over inheritance

Traits define required behavior and are the Rust equivalent of many Java interfaces or Kotlin interfaces. Use them as application ports for dependencies such as repositories, clocks, queues, signers, and external gateways.

```rust
#[async_trait::async_trait]
pub trait OrderRepository: Send + Sync {
    async fn find(&self, id: &OrderId) -> Result<Option<PurchaseOrder>, RepositoryError>;
    async fn save(&self, order: &PurchaseOrder) -> Result<(), RepositoryError>;
}
```

## Rules

- Keep traits small and capability-oriented.
- Put traits near the layer that consumes them, not necessarily next to their implementation.
- Require `Send + Sync` for dependencies held by multithreaded web applications.
- Prefer generic parameters for compile-time composition; use `Arc<dyn Trait>` where runtime wiring is needed.
- Do not recreate large Java service interfaces with dozens of unrelated methods.

---

# Page 14 — Generics and Abstractions

## Reuse without losing types

Generics enable reusable code while retaining compile-time type information. Use them when the same algorithm applies to different data types.

```rust
pub struct Page<T> {
    pub items: Vec<T>,
    pub total: u64,
    pub page: u32,
    pub page_size: u32,
}
```

## Rules

- Prefer concrete types in business logic until an abstraction is proven useful.
- Add the smallest trait bounds required by the implementation.
- Avoid generic type parameters that make public APIs hard to read.
- Do not use generics merely to emulate Java generic repository frameworks.
- Use associated types when a trait naturally has one output or identifier type.

---

# Page 15 — Error Architecture

## Errors are data

Use `Result<T, E>` for recoverable failures. Define domain errors that callers can classify and handle safely.

```rust
#[derive(Debug, thiserror::Error)]
pub enum DomainError {
    #[error("order cannot be submitted from its current state")]
    InvalidOrderTransition,
    #[error("quantity must be greater than zero")]
    InvalidQuantity,
    #[error("insufficient inventory")]
    InsufficientInventory,
}
```

## Rules

- Never use exceptions as hidden control flow; Rust has no exceptions.
- Use typed errors for expected domain failures.
- Attach operational context at application boundaries.
- Do not return internal database, RPC, SQL, stack, or secret details to API clients.
- Map errors to stable API error codes and appropriate HTTP status codes.

---

# Page 16 — No Panic Policy

## Production rule

A panic terminates the current task or process depending on configuration. In enterprise request handling, background processing, ledger execution, and integrations, panics are defects unless deliberately isolated.

## Rules

- Prohibit `unwrap`, `expect`, indexing that can fail, and unchecked conversions in production paths.
- Permit `unwrap` only in tests, examples, or startup code where failure intentionally aborts initialization and the reason is clear.
- Replace `unwrap` with `?`, `ok_or`, `map_err`, a match expression, or an explicit fallback.
- Validate external input before parsing or indexing.
- Treat a panic observed in production as an incident-worthy bug.

---

# Page 17 — Async Runtime Rules

## Tokio

Async Rust is suitable for waiting on network, database, queue, storage, and timer operations. `async fn` returns a future; Tokio drives it to completion.

```rust
pub async fn get_order(
    repository: &dyn OrderRepository,
    id: &OrderId,
) -> Result<PurchaseOrder, AppError> {
    repository.find(id).await?
        .ok_or(AppError::OrderNotFound)
}
```

## Rules

- Use async for I/O-bound workflows, not as a default substitute for all concurrency.
- Never block Tokio worker threads with synchronous network calls, long file operations, expensive cryptography, or heavy CPU loops.
- Use `spawn_blocking` or a dedicated worker pool for blocking or CPU-bound work.
- Set timeouts around all remote dependencies.
- Propagate cancellation and deadlines when possible.

---

# Page 18 — Shared State and Synchronization

## Controlled mutability

Web services typically share immutable configuration and connection pools through `Arc`. Use locks only for small, in-memory mutable state and keep lock duration short.

```rust
use std::sync::Arc;

pub struct AppState {
    pub orders: Arc<dyn OrderRepository>,
    pub ledger: Arc<dyn LedgerGateway>,
}
```

## Rules

- Prefer a database, queue, or actor-like ownership model over large shared mutable in-memory maps.
- Never hold a mutex guard across `.await`.
- Use `tokio::sync` primitives inside async workflows when appropriate.
- Use `std::sync` primitives for short non-awaiting critical sections.
- Design idempotent database transactions instead of relying on in-memory locks for cross-instance correctness.

---

# Page 19 — HTTP API Layer

## Axum boundary

HTTP handlers parse, authenticate, authorize, validate, call application services, and map results to stable responses. They must not contain complex domain calculations.

```rust
async fn create_order(
    State(state): State<AppState>,
    Json(command): Json<CreateOrderRequest>,
) -> Result<(StatusCode, Json<OrderResponse>), ApiError> {
    let order = state.orders_service.create(command).await?;
    Ok((StatusCode::CREATED, Json(order.into())))
}
```

## Rules

- Keep request and response DTOs separate from domain entities.
- Validate syntax at the API boundary; validate business invariants in the domain layer.
- Return explicit content types, status codes, and machine-readable error codes.
- Enforce request body limits, timeouts, authentication, and authorization centrally.
- Never expose private keys, internal errors, or raw vendor error payloads.

---

# Page 20 — DTO Mapping

## Separate external contracts

A DTO represents an API, message, or persistence boundary. A domain entity represents business rules. Map explicitly between them.

```rust
#[derive(serde::Deserialize)]
pub struct CreateOrderRequest {
    pub supplier_id: String,
    pub lines: Vec<CreateOrderLineRequest>,
}

impl TryFrom<CreateOrderRequest> for CreateOrderCommand {
    type Error = ApiError;

    fn try_from(value: CreateOrderRequest) -> Result<Self, Self::Error> {
        Ok(Self { supplier_id: SupplierId::parse(value.supplier_id)?, lines: value.lines })
    }
}
```

## Rules

- Do not deserialize directly into domain entities when input requires validation or transformation.
- Make mapping fallible when parsing IDs, dates, currency, enums, or user input.
- Version public DTOs intentionally; do not leak internal refactors into external APIs.
- Normalize input once at the boundary.

---

# Page 21 — PostgreSQL and SQLx

## Persistence rules

Use PostgreSQL for transactional business data, relational constraints, audit records, idempotency keys, and outbox records. SQLx provides direct SQL access and async pooling.

```rust
let row = sqlx::query_as::<_, OrderRow>(
    "SELECT id, status FROM purchase_orders WHERE id = $1"
)
.bind(order_id.0)
.fetch_optional(&pool)
.await?;
```

## Rules

- Use parameterized queries only; never concatenate user values into SQL.
- Keep SQL close to repository implementations, not domain objects.
- Use database transactions for atomic business updates.
- Add database constraints for invariants that must survive multiple services or workers.
- Store timestamps in UTC and use timezone-aware types at API boundaries.

---

# Page 22 — Transactions and Idempotency

## Exactly-once intent

Networks, queues, and clients retry. Design operations so repeated requests produce the same safe outcome rather than duplicated transfers, invoices, stock deductions, or chain submissions.

## Rules

- Require an idempotency key for externally initiated financial or ledger-changing commands.
- Store key, request fingerprint, outcome, status, and expiration in the same database transaction as the command result where possible.
- Use unique constraints to enforce deduplication.
- Make chain submission state durable before and after remote calls.
- Never assume an HTTP timeout means an external action did not occur.

---

# Page 23 — Outbox and Event Delivery

## Reliable integration

The transactional outbox pattern records an event in the same database transaction as the business state change. A worker later publishes it to a queue, webhook, or blockchain adapter.

```text
Transaction:
1. Update order state
2. Insert audit record
3. Insert outbox event
4. Commit

Worker:
1. Claim event
2. Deliver event
3. Mark delivered or schedule retry
```

## Rules

- Use outbox records for important cross-service events.
- Include event ID, aggregate ID, event type, schema version, payload, timestamp, correlation ID, and retry state.
- Consumers must be idempotent because delivery is usually at-least-once.
- Do not publish a message before the database transaction commits.

---

# Page 24 — Blockchain Boundary

## Enterprise blockchain adapter

Treat a blockchain network as an external, unreliable, eventually consistent dependency. Keep chain-specific RPC calls, transaction encoding, account management, and confirmation tracking behind an adapter trait.

```rust
#[async_trait::async_trait]
pub trait LedgerGateway: Send + Sync {
    async fn submit(&self, command: LedgerCommand) -> Result<Submission, LedgerError>;
    async fn confirmation(&self, tx_hash: &TxHash) -> Result<ConfirmationStatus, LedgerError>;
}
```

## Rules

- Do not spread SDK-specific types across the domain or API layers.
- Persist submission intent and transaction metadata durably.
- Treat submitted, mined, finalized, reverted, and unknown as separate states.
- Reconcile chain state with background workers; do not rely only on synchronous API responses.
- Do not put confidential business data or personal data on a public immutable chain.

---

# Page 25 — Cryptography and Keys

## Security boundary

Cryptographic code and private-key handling are high-risk. Use mature audited libraries and managed key systems; do not design custom signing, encryption, hashing, nonce, or key-derivation algorithms.

## Rules

- Store private keys in an HSM, cloud KMS, Vault, or equivalent protected signer where possible.
- Do not log secrets, seed phrases, private keys, authorization headers, signed payloads, or raw customer credentials.
- Separate signing authorization from transaction construction.
- Validate chain ID, recipient, amount, nonce, gas policy, and contract method before signing.
- Require multi-party approval or policy checks for high-value operations.
- Rotate credentials and maintain revocation procedures.

---

# Page 26 — Smart Contract Interaction

## Contract safety

Client code must treat smart-contract calls as versioned external contracts. A successful RPC response does not automatically mean business finality.

## Rules

- Pin contract addresses per environment and network.
- Version and validate ABIs or interface definitions.
- Simulate or estimate transactions before submission when supported.
- Set explicit fee caps, gas limits, and transaction deadlines according to policy.
- Decode revert reasons only for internal diagnostics; expose stable business errors externally.
- Watch confirmations and reorganization risk before marking settlement as final.

---

# Page 27 — Authorization and Tenancy

## Business access control

Authentication identifies a caller; authorization decides what the caller can do. Multi-tenant business systems must attach tenant scope to every command, query, event, and audit entry.

```rust
pub struct RequestContext {
    pub tenant_id: TenantId,
    pub actor_id: ActorId,
    pub roles: Vec<Role>,
    pub correlation_id: CorrelationId,
}
```

## Rules

- Enforce tenant filtering in every repository query and unique constraint strategy.
- Do not trust tenant ID supplied in request JSON when it can be derived from credentials.
- Check authorization in the application layer before executing state changes.
- Maintain an auditable record of privileged actions and policy decisions.
- Apply least privilege to services, database roles, queue credentials, and signing capabilities.

---

# Page 28 — Validation Rules

## Layered validation

Validate data at multiple layers, each for a distinct reason.

- API layer: format, required fields, payload size, JSON shape
- Domain layer: business invariants and valid state transitions
- Persistence layer: uniqueness, foreign keys, non-null requirements, check constraints
- Integration layer: vendor schema, network rules, response verification

## Rules

- Do not rely on frontend validation.
- Return clear field-level validation errors for client-correctable input.
- Avoid duplicate validation logic when a domain constructor can be reused.
- Normalize strings, units, identifiers, and dates before comparing or storing them.

---

# Page 29 — Testing Strategy

## Test the rules that matter

Rust has built-in unit and documentation test support. Enterprise applications also need integration, contract, migration, and end-to-end tests.

```rust
#[test]
fn draft_order_can_be_submitted_when_it_has_lines() {
    let mut order = PurchaseOrder::draft(/* ... */);
    order.submit().unwrap();
    assert!(matches!(order.status, PurchaseOrderStatus::Submitted));
}
```

## Rules

- Unit-test domain invariants and state transitions without databases or networks.
- Integration-test SQL queries, migrations, queue adapters, and blockchain adapters against controlled environments.
- Use test fixtures/builders with safe defaults.
- Test idempotency, retries, timeout ambiguity, authorization boundaries, and failure recovery.
- Keep tests deterministic; inject clock, random source, and external ports when needed.

---

# Page 30 — Property and Fuzz Testing

## High-value automated checks

Property-based tests generate many inputs to test invariant behavior. Fuzzing helps discover parser, decoder, and input-validation failures.

```rust
// Example invariant: total must never be negative and line quantity must be positive.
```

## Rules

- Use property tests for pricing, tax, currency conversion, ordering, serialization, and state transitions.
- Fuzz API parsers, blockchain payload decoders, file importers, and protocol boundaries.
- Assert that malformed external input produces a controlled error, not panic or resource exhaustion.
- Persist minimized failing inputs as regression tests.

---

# Page 31 — Observability

## Structured tracing

Use `tracing` with structured fields so request, job, ledger, and database activity can be correlated across components.

```rust
#[tracing::instrument(skip(service), fields(order_id = %order_id, tenant_id = %context.tenant_id))]
async fn submit_order(/* ... */) -> Result<(), AppError> {
    Ok(())
}
```

## Rules

- Include correlation ID, tenant ID, actor ID where permitted, aggregate ID, event ID, and transaction hash when available.
- Never log secrets or regulated personal data.
- Track metrics for latency, error rate, retries, queue age, chain confirmation time, and idempotency conflicts.
- Emit health and readiness checks that reflect real dependency readiness.

---

# Page 32 — Configuration and Secrets

## Typed startup configuration

Parse environment configuration once at startup into a validated typed structure. Fail fast for missing critical configuration before accepting traffic.

```rust
pub struct Config {
    pub database_url: secrecy::SecretString,
    pub http_port: u16,
    pub chain_id: u64,
}
```

## Rules

- Separate local, test, staging, and production configuration.
- Treat URLs, credentials, signing configuration, allowed origins, and feature flags as environment-specific.
- Do not commit real secrets, `.env` production files, or private keys.
- Redact secrets in debug output and errors.
- Prefer managed secret injection in deployment environments.

---

# Page 33 — Serialization Rules

## Stable data interchange

Use Serde for JSON and other formats. Serialization schemas are contracts: change them with versioning and backward compatibility in mind.

```rust
#[derive(serde::Serialize, serde::Deserialize)]
pub struct OrderEventV1 {
    pub event_id: String,
    pub order_id: String,
    pub occurred_at: chrono::DateTime<chrono::Utc>,
}
```

## Rules

- Use explicit field names and enum tagging strategies for public schemas.
- Avoid serializing internal domain types directly if their structure may evolve.
- Reject unknown fields for security-sensitive commands when forward compatibility is not required.
- Use canonical serialization rules when data is signed or hashed.
- Version event schemas and retain decoders for active historical versions.

---

# Page 34 — Java and Kotlin Mapping Guide

## Direct conceptual replacements

| Java/Kotlin concept | Rust-oriented replacement |
|---|---|
| `null`, nullable references | `Option<T>` |
| Checked/unchecked exception | `Result<T, E>` |
| Interface | Trait |
| Abstract class | Trait + composition or enum |
| Inheritance | Composition, trait implementation, enum |
| `data class` | Struct with derived traits |
| `sealed class` | Enum |
| `Optional<T>` | `Option<T>` |
| `CompletableFuture`, coroutine `suspend` | `async fn`, `Future`, Tokio |
| Singleton dependency | Explicit application state / dependency injection |
| ORM entity everywhere | Domain model + persistence row + DTO mapping |
| `BigDecimal` | `rust_decimal::Decimal` or integer minor units |

## Rules

- Do not attempt to reproduce JVM reflection patterns.
- Replace annotation-driven behavior with explicit code, macros, builder configuration, or compile-time traits.
- Prefer explicit error paths over `try/catch`-style translated wrappers.

---

# Page 35 — Function Rewrite Template

## Rewrite procedure

For every Java/Kotlin function, rewrite from contract outward rather than syntax inward.

1. State the inputs, outputs, side effects, errors, authorization, and idempotency behavior.
2. Convert nullable inputs and fields to `Option<T>`.
3. Convert exception cases into a typed `Result<T, E>`.
4. Extract domain rules from controllers, services, and ORM callbacks into domain methods.
5. Pass dependencies as trait-based services or application state.
6. Add tests for normal, invalid, repeated, and failure paths.

## Example

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

# Page 36 — Performance and Resource Safety

## Measure first

Rust is capable of high performance, but safe design and correct algorithms matter more than premature micro-optimization. Profile representative workloads before changing code for speed.

## Rules

- Avoid unnecessary allocation and cloning in frequently executed paths.
- Stream large imports and exports instead of loading whole files into memory.
- Paginate database queries and use keyset pagination for large ordered datasets when suitable.
- Bound queues, concurrency, payload size, retries, and cache growth.
- Use connection pools with explicit limits and timeouts.
- Protect services against expensive input, decompression bombs, and unbounded recursion.

---

# Page 37 — Security Baseline

## Defensive defaults

Enterprise Rust applications need secure system design beyond memory safety.

## Rules

- Authenticate every non-public endpoint and authorize every tenant-scoped action.
- Use TLS for all external communication.
- Parameterize SQL and validate all inputs.
- Apply request size limits, rate limits, timeouts, and concurrency limits.
- Store passwords using an established password-hashing library and modern policy.
- Implement dependency scanning, secret scanning, code review, and patch management in CI/CD.
- Use security headers and strict CORS policy for browser-facing APIs.
- Define audit, retention, incident response, and backup requirements before production launch.

---

# Page 38 — CI/CD Quality Gates

## Required pipeline

Every merge and release should pass formatting, linting, tests, security checks, and build verification.

```bash
cargo fmt --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
cargo build --workspace --release
```

## Rules

- Run database migrations against an ephemeral test database in CI.
- Run integration tests with controlled dependencies.
- Scan dependencies for known vulnerabilities and review lockfile changes.
- Produce versioned immutable build artifacts.
- Require manual approval and change records for production blockchain configuration or signing-policy changes.

---

# Page 39 — AI Code Review Checklist

## Before accepting generated Rust

- Does each function have a clear domain responsibility?
- Are all fallible operations represented by `Result` and propagated safely?
- Are nullable values modeled as `Option`?
- Are money values free from floating-point arithmetic?
- Is tenant and authorization scope enforced before data access or mutation?
- Is database work transactional where business consistency requires it?
- Is any external call protected by timeout, retry policy, and idempotency design?
- Does code avoid `unwrap`, `expect`, uncontrolled panics, and unsafe blocks?
- Are logs structured and free of secrets?
- Are DTO, persistence, domain, and chain SDK types kept in their proper layers?
- Are tests present for success, validation failure, authorization failure, retry, and duplicate execution?

---

# Page 40 — Production Release Rules

## Release gate

Do not deploy an enterprise or blockchain-connected Rust service until its data integrity, key controls, observability, and recovery processes are verified.

## Mandatory checks

- Release binaries are built with `cargo build --release`.
- Environment configuration has been validated in staging.
- Schema migrations are reviewed, reversible where appropriate, and backed up.
- Idempotency, transaction handling, and outbox delivery have been tested under retries.
- Blockchain network, chain ID, contract addresses, ABI version, and signing policy are confirmed.
- Secrets are injected through approved secret management, not files or source code.
- Monitoring, alerting, logs, metrics, traces, health checks, and runbooks are available.
- Rollback, reconciliation, backup restore, and incident response procedures are tested.
- Privileged actions have audit logging and appropriate approval controls.

---

# Official Reference

The official Rust Book introduces core Rust concepts such as installing the toolchain, using Cargo, and fundamental programming concepts; this library is a business-oriented, original implementation guide built around those foundations. [The Rust Programming Language](https://doc.rust-lang.org/book/)
