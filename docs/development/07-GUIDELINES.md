# Development Guidelines

This document covers the development approach, architecture decisions, and pre-development considerations.

---

## Development Approach: Role-Based Progressive Development

> **Strategy:** Features are organized by role (Instructor → Student → Admin), with each phase building integrated experiences. Student-facing counterparts are built alongside instructor features within the same phase to ensure end-to-end functionality. Each phase is self-contained and deployable independently.

### Architecture Decisions Made

| Decision Area | Approach |
|---------------|----------|
| **Unified Assessment System** | Quizzes and exams share one model with configurable settings (time limit, attempts, proctoring, etc.) |
| **Release Condition Engine** | Brightspace-style full condition engine with nested AND/OR rules, evaluated in real-time with caching |
| **Grade Scales** | Custom scales (admin/instructor-defined with any labels and thresholds) |
| **MFA** | Email OTP + TOTP (authenticator apps) |
| **Course Approval** | Simple review workflow (submit → approve/reject → publish) |
| **Data Retention** | Full compliance suite (GDPR + FERPA + configurable per-type retention) |
| **Activity Tracking** | Full telemetry (scroll depth, video %, click heatmaps, idle detection, device info) |
| **Assessment Config** | Enterprise-level (proctoring hooks, honor code, late grace period, adaptive difficulty, IP restriction, password-protected) |

---

## Recommended Development Paths

### Path A: Role-First (CHOSEN)

```
Phase 14: Instructor Core → Phase 15: Student Core → Phase 16: Admin Core → Phase 17-19: Cross-role
```

**Pros:**
- Each role gets a complete experience before moving on
- Easier to test role isolation
- Instructor tools exist before student tools need them

**Cons:**
- Students wait until Phase 15 for their features

### Path B: Feature-Domain

```
Assessment Domain → Grading Domain → Scheduling Domain → Admin Domain
```

**Pros:** Each feature is fully complete across all roles before moving on.
**Cons:** Partial experiences for all roles simultaneously. Harder to demo progress.

### Path C: Dependency-Optimized

```
Data Models → APIs → Instructor UI → Student UI → Admin UI
```

**Pros:** No wasted work. Backend is rock-solid before UI.
**Cons:** No usable UI for a long time. Hard to validate UX decisions.

---

## Pre-Development Considerations

### Database Migration Strategy

1. All new models are **additive** (no breaking changes to existing tables)
2. New fields on existing models should be **nullable** to preserve backward compatibility
3. Run `prisma migrate dev` per phase, not per feature, to minimize migration count
4. Migration naming convention: `YYYYMMDD_phase_XX_feature_name`

### Testing Strategy

1. Each new API route gets unit tests (Jest + `@jest-environment node` pattern)
2. Integration tests for cross-model workflows (e.g., assignment → submission → grade → gradebook)
3. Run full test suite before each phase merge
4. Target: maintain 100% pass rate, add 15-25 tests per phase

### Performance Considerations

| Area | Strategy |
|------|----------|
| **Release Condition Engine** | Redis caching (Upstash) for evaluated conditions with TTL invalidation |
| **Full Telemetry** | Batched writes (5-10 events), separate telemetry table with periodic cleanup |
| **Gradebook Calculation** | Pre-calculate and cache totals, invalidate on grade change |
| **SCORM Runtime** | Message queuing to avoid blocking UI |

### Security Considerations

| Area | Requirements |
|------|--------------|
| **File Submissions** | Validate file types server-side. Scan for malicious content headers. Store in isolated paths. |
| **Grade APIs** | Strict instructor/admin-only access. Never expose grade calculation logic to students. |
| **MFA** | Store TOTP secrets encrypted. Rate-limit OTP attempts (5 failures → lockout). |
| **SAML** | Validate XML signatures. Prevent XXE attacks in metadata parsing. |
| **Webhooks** | Sign payloads with HMAC-SHA256. Validate webhook URLs (no internal IPs). Timeout after 10s. |

---

_See [README.md](./README.md) for navigation to other documentation sections._
