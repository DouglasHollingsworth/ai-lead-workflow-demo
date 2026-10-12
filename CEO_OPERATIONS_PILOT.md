# Polsia-inspired operations loop: lessons and KAIJ pilot

## Attribution / evidence boundaries
- Polsia's own public site and investor deck describe engineering, research, support, marketing, monitoring, outreach, and payment workflows: https://polsia.com/ and https://polsia.com/deck
- Founder interview discusses the model of provisioning app/server/database/email/payment infrastructure per new venture: https://podcasttranscript.ai/library/agents-at-work-21-your-next-co-founder-is-an-ai
- The independent open-source open-polsia project documents an example architecture (not Polsia's private implementation): https://github.com/AI-Builder-Club/open-polsia/blob/main/docs/architecture.md
- Third-party implementations and publicity claims are NOT a verified source of Polsia's proprietary internals or business economics.

## Seven patterns worth adapting
1. CEO as constrained planner: proposes bounded tasks, never silently spends, sends, or deploys.
2. Worker status integrity: new task states suggested → approved → in_progress → completed, failed or needs_continuation.
3. Durable business profile + explicit measurable objective that informs task decisions.
4. Role-specific agent/tool grants: Strategy, Research, Sales, Operations, Finance, Engineering/QA (planned).
5. Evidence before completed: record artifact/outcome; don't equate an AI response with shipped work or revenue.
6. Daily rhythm, spend accounting and exception routing: eventual server-side schedule and queue, never a fragile browser timer.
7. Repeatable methods vs segregated company secrets: share tested workflow templates, never leak customers or private IP between ventures.

## Phase 2 added to the existing KAIJ revenue pilot
- ceo-operations.js / ceo-operations.css appended AFTER the existing workflow and revenue pilot.
- Single KAIJ company identity; local-only editable objective.
- Rule-based suggestions drawn from existing lead records and a finite preparation-task set; no invented prospects.
- Three-task pending cap, task/role/reason, duplicate-key protection, manual CEO review.
- Explicit owner transitions: suggested → approved → in_progress → completed/needs_continuation/failed, rejected when unstarted.
- No direct completed transition; completion/continuation/failure/rejection require meaningful owner-entered explanation.
- Cannot start a second task while one is in progress or continuation.
- Concise review report that separates lead entries, non-example contact records and human-reported wins.
- Clear no-API/no-autonomous-worker disclosure; no simulated revenue attributed as a real transaction.
- The existing reset button clears the separate CEO pilot memory key, without changing the original app's data format.

## How to verify
1. Open index.html after all assets load.
2. Run the existing lead demo and approve its follow-up.
3. Click Plan next work. It should propose at most three tasks.
4. Click Plan again and confirm the queue does not grow with duplicate tasks.
5. Select a task, Approve, Begin; next planning run should identify unfinished work.
6. Try completion without 12 characters of evidence: must be denied.
7. Complete with meaningful evidence; next planning run refills at most one slot.
8. Change KAIJ goal; reload and confirm it persisted; reset demo and confirm cleared.
9. Verify there are no outbound network calls in the pilot code.
10. Run Node syntax checks and the tests under tests/*.test.cjs.

## Production connection — next, not done
The private KAIJ Business OS source is authoritative, but unavailable to the current GitHub connection.
Port the proposal and task-state logic into that EXISTING Next.js / Supabase stack.
Persist tenant/business ID, owner, roles, approvals, idempotency keys, source URLs, source freshness, task budget, run logs and signed artifact evidence.
Implement a real durable scheduler and worker with the existing provider adapter and cost kill switch.
Gradually grant only read-only research and proposal tools first. Add outbound actions with separate explicit authorization.
Never use this public browser-local demo to store real confidential prospect or customer information.

## First measured business test
One owner-approved KAIJ consulting offer, twenty verified prospects, five real conversations, two proposals, one paid invoice confirmed from a payment source.
Track tasks, total agent spend, founder time, qualified response rate, proposal conversion and verified collections.
Treat zero transactions as zero revenue even when a model says a proposal looks promising.