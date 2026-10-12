# Revenue Operations Pilot (KAIJ)

## Scope
This is a safe extension of the EXISTING public AI Lead Workflow Demo, not a new business platform.
Actual mode: rule-based, browser-local, no external integrations, no AI model API, no sending, no paid operations.
All customer lead records and payment amounts must be entered by a person; no fictional leads or sales are generated.

## Implemented
- Existing lead intake, scoring, original approval state, and browser data key are preserved.
- Revenue dashboard distinguishes open opportunity from won/booked and human-reported received amounts.
- A propose-only operating review ranks approval, manual outreach, proposal, and payment follow-ups.
- Human-entered stages: New, Contacted, Proposal, Won, Lost, with amounts and evidence notes.
- Contacted, Proposal, and Won require a note; money received cannot exceed opportunity value.
- CSV export protects cells against spreadsheet formula injection.
- Review history is browser-local and cleared by the existing Reset Demo button.
- No email, prospect scraping, ads, billing, deployment, or financial verification takes place.

## Manual verification
1. Open index.html or serve with python -m http.server 8000.
2. Load sample and run the original decision workflow.
3. Run review; should recommend approval (not claim a sent email).
4. Approve draft and rerun; must explicitly recommend manual sending.
5. Set Contacted with a note; original scoring and approval remain intact.
6. Set Proposal with $1500. Open pipeline becomes $1500, booked $0.
7. Set Won with $1500 and received $500. Booked $1500, reported collected $500.
8. Run review; must identify outstanding balance.
9. Export outcomes CSV. Reset demo and verify both original and review data clear.

## Production integration: existing KAIJ, NOT a replacement
The separate AI Business OS case study documents an already-built private Next.js/React/TypeScript app,
Supabase/PostgreSQL, provider abstraction, cost quotas, and server-side auth boundaries.
The authoritative private KAIJ repository is not accessible with this current GitHub connection.
DO NOT treat this public demo as the source of truth or deploy it as a secure founder console.
Once the private repo is accessible, port the rules into its existing services:
- Persist opportunities per business_id using existing Supabase RLS and auth.
- Make operator review a bounded queue task with idempotency, audit events, and approvals.
- Preserve provider abstraction and shared usage/kill-switch policies.
- Require human approval before contact, spending, deployments, or financial commitments.
- Only classify received revenue as verified after checking a real payment record.
- Keep KAIJ, AirRadius, and Jarvis fully isolated; this pilot is KAIJ-specific.

## Success test
Twenty real relevant prospects, five real conversations, two scoped proposals, one evidenced paid customer.
Do not claim any of those results from demonstration data.

## References
Polsia public product claims and third-party open-polsia architecture were studied for patterns.
The pilot contains original deterministic operations logic and no copied proprietary Polsia code.