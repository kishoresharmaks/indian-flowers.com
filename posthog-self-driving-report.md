# PostHog Self-driving setup report

## Summary

PostHog Self-driving is configured for this web commerce application. Session Replay, Error Tracking, and Support are enabled; health, error, and support signal sources are enabled; and the scout troop plus two Replay Vision monitors are armed.

Findings will start appearing in the [Self-driving inbox](https://us.posthog.com/project/617367/inbox) within about 30 minutes once fresh data arrives.

## AI data processing

Approved by the wizard's organization-level gate before this setup ran.

## GitHub

GitHub was already connected through the PostHog GitHub App. No GitHub Issues responder was enabled because the connected-tools selection was dismissed.

## Products enabled

| Product | Result | Notes |
| --- | --- | --- |
| Session Replay | Already enabled | Web SDK initialization does not disable recording. No recordings were present during setup. |
| Error Tracking | Already enabled | Web SDK initialization explicitly enables exception capture. |
| Support (Conversations) | Enabled | Tickets will begin flowing only after an inbound email, inbox, or Slack channel is connected in PostHog. |

## Signal sources

| Source product | Source type | Action |
| --- | --- | --- |
| `health_checks` | `health_issue` | Enabled (`01a0b7f2-ace3-7ffc-a96e-b0500da1934d`) |
| `error_tracking` | `issue_created` | Enabled (`01a0b7f2-ac94-7db6-8f15-972c7922f2e8`) |
| `error_tracking` | `issue_reopened` | Enabled (`01a0b7f2-ac8f-737a-9c63-c9c368645561`) |
| `error_tracking` | `issue_spiking` | Enabled (`01a0b7f2-ad1c-771b-bd85-c34f965ea6e7`) |
| `conversations` | `ticket` | Enabled (`01a0b7f2-ac79-775e-8517-663790a010d8`) |
| `signals_scout` | `cross_source_issue` | No row created; Self-driving scout findings are enabled by default. |
| `session_replay` | `session_analysis_cluster` | Deliberately skipped; Replay Vision scanners are the current route for replay findings. |

## Connected tools

No external issue-tracker, support-desk, error-tracker, or warehouse tool was selected in this run. No external-tool responder was enabled or connected. GitHub remains connected at the integration level.

## Scout troop

The project has a confirmed budget of **100 scout runs per day**; **0** had been used at setup time. The early-access banner says: “Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more.”

### Active scouts

| Scout | What it watches |
| --- | --- |
| General | Cross-product correlations and surfaces without a dedicated active specialist. |
| Product analytics | Core flows, funnels, retention, lifecycle, and stickiness regressions. |
| Web analytics | Traffic, attribution, landing-page health, and bounce changes. |
| License lifecycle health | Store-license activation and renewal-verification health. |

The other 24 built-in scouts are disabled to keep the troop selective. Error tracking is covered by its native source, and session replay is covered by the Replay Vision monitors, so their built-in scouts remain disabled. The other specialists can be enabled later from the inbox if their corresponding product surfaces become active.

## Custom scouts

### Created

| Scout | Surface and discriminator | Why it is custom |
| --- | --- | --- |
| `signals-scout-license-lifecycle-health` | Watches `license_activated` and `license_renewal_verified` for sustained complete-window drops or flatlines against their own baselines, requiring corroborating licensing errors or adjacent demand before reporting. | The store-license activation and Razorpay renewal-verification workflow is application-specific and is not owned by an enabled built-in scout. It points investigation to `app/api/license/activate/route.ts` and `app/api/license/renew/razorpay/verify/route.ts`. |

The proposed order/payment reconciliation scout was declined. If the custom licensing scout becomes noisy, set `emit: false` on its config in PostHog to make it dry-run without sending inbox findings.

## Replay Vision scanners

A Replay Vision scanner is an LLM that watches individual session recordings on a schedule and pushes qualified findings to the Self-driving inbox. These are the only items in this setup that spend Replay Vision quota. Each finding arrives at half weight and therefore needs independent corroboration before a report is promoted.

No session recordings existed during setup, so both monitors are armed at **0 estimated monthly observations / 0 estimated monthly credits** and will begin scanning as recordings arrive. The current organization quota has 2,500 credits remaining.

| Scanner | Result | What it watches | Query scope | Sampling | Estimated spend |
| --- | --- | --- | --- | --- | --- |
| BeesHub checkout breakage | Created | Visible cart, payment-option, UPI-reference, order-submit, and confirmation failures. | Sessions with `$pathname` exactly `/`; checkout is a modal on the root storefront in `app/page.tsx`. | 0.5 | 0 observations / 0 credits per month currently |
| BeesHub storefront frustration | Created | Clear rage-click frustration around product variants, cart updates, checkout, UPI reference entry, and order submission. | Sessions containing `$rageclick` only; no URL filter was added to keep this monitor distinct. | 1.0 | 0 observations / 0 credits per month currently |

## Follow-ups

- [ ] Connect an inbound Support channel (email, inbox, or Slack) in PostHog so Conversations tickets can reach the enabled ticket responder.
- [ ] Generate browser traffic after deployment so Session Replay records sessions and the armed Replay Vision monitors can begin scanning.
- [ ] After observations arrive, review and rate scanner results from the Replay Vision scanner pages to receive tuning recommendations.
- [ ] If external tool findings are wanted later, select and connect the relevant tracker or desk from [integration settings](https://us.posthog.com/project/617367/settings/environment-integrations), then enable its responder.

## What happens next

Fresh scout configurations are picked up by the coordinator within about 30 minutes and draw from the daily run budget. Findings are grouped into reports in the Self-driving inbox; immediately actionable reports can start coding tasks.

## Files created

- `posthog-self-driving-report.md` — this setup report.

No application source files were modified.
