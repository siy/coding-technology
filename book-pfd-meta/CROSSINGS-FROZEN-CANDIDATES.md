# Run 5 — frozen candidate operation list

**Committed 2026-08-22, BEFORE the Mastodon repository was cloned and before any actual operation was
enumerated.** This is step 3 of the procedure in `CROSSINGS-COMPLETENESS-PREDICTIONS.md`. Nothing below
was derived from the codebase. It comes from public protocol and integration documentation only:
ActivityPub, WebFinger, the Mastodon REST/streaming API docs, OAuth 2.0, Web Push, NodeInfo.

**This file is frozen.** Any later edit invalidates the run.

## The crossings

| # | Crossing | Source of the contract |
|---|---|---|
| C1 | ActivityPub federation (server-to-server) | W3C ActivityPub + ActivityStreams vocabulary |
| C2 | WebFinger actor discovery | RFC 7033 |
| C3 | REST client API (client-to-server) | Mastodon API docs |
| C4 | OAuth 2.0 authorization | RFC 6749 |
| C5 | Streaming API (WebSocket / SSE) | Mastodon streaming docs |
| C6 | Web Push | RFC 8030 + VAPID |
| C7 | Outbound e-mail | SMTP |
| C8 | Media / object storage | S3-compatible object API |
| C9 | Instance metadata | NodeInfo |
| C10 | Public syndication feeds | RSS |

## Candidate operations, derived from the crossings alone

**C1 — ActivityPub (16)**
receive-activity · deliver-activity · fetch-remote-object · create-status · edit-status · delete-status ·
follow-account · accept-follow · reject-follow · boost-status · favourite-status · undo-action ·
block-account · report-account · move-account · pin-status

**C2 — WebFinger (1)**
discover-actor

**C3 — REST client API (15)**
register-account · post-status · upload-media · fetch-timeline · fetch-notifications · fetch-account ·
search · manage-list · manage-filter · bookmark-status · vote-in-poll · mute-account · edit-profile ·
fetch-status-context · manage-follow-request

**C4 — OAuth (3)**
register-application · authorize-application · issue-token

**C5 — Streaming (2)**
subscribe-to-stream · publish-stream-event

**C6 — Web Push (2)**
register-push-subscription · send-push-notification

**C7 — E-mail (3)**
send-confirmation-email · send-notification-email · send-password-reset

**C8 — Media storage (2)**
store-attachment · serve-attachment

**C9 — Instance metadata (1)**
serve-instance-metadata

**C10 — Syndication (1)**
serve-account-feed

**Total: 46 candidate operations.**

## Recorded before enumeration

Three things worth writing down now, because they will be tempting to assert afterwards:

1. I expect the residual to contain **moderation and administration** work (suspending accounts, domain
   blocks, instance-level policy). Some of it is reachable from C1's `Flag` activity, most is not,
   because administration is a human-facing crossing rather than a protocol one. If most of the residual
   is admin, that is a **partial** result for P2 rather than a hit: admin is externally triggered, just
   not by a machine protocol.
2. I expect **maintenance and housekeeping** operations — retention, cleanup, refresh, backfill — to
   trace to nothing, which is the P2 prediction.
3. The candidate list uses coarse names (`manage-list`, `manage-filter`) that will map to several
   controller actions each. That inflates apparent coverage in P1 and is a known weakness of the
   proxy — recorded now so it cannot be presented as a strength later.
