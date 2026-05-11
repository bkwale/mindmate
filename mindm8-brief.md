# MindM8 — Product Brief

**Mission:** Help people process stress, overwhelm, and difficult emotions through AI-guided reflection — privately, accessibly, and without clinical labels.
**Stage:** Review (live product, validating with real users)
**Last Updated:** May 2026

## Current State
- Live PWA at mindm8.app, built with Next.js + Anthropic Claude API
- Four session modes: Arrive Clearer (reflection), Arrive Ready (conversation prep), Arrive Present (grounding), Just Be Here (breathing)
- All user data in localStorage — no accounts, no cloud storage, no data collection
- Privacy by architecture: technically impossible to access user reflections server-side
- CBT-informed questioning that stays outside MHRA medical device classification
- Anonymous server-side analytics via Vercel KV (app opens, sessions, completion rates, voice usage)
- Voice input across all modes via Web Speech API
- ND-aware pattern detection (6 detectors: overwhelm cycles, shutdown gaps, fixation loops, time-of-day patterns, rejection sensitivity, energy crashes)
- Safety layer with crisis detection redirecting to Samaritans/988/findahelpline.com
- PIN lock with recovery words, auto-lock on idle
- PWA with service worker caching, install prompts, push notification infrastructure
- Compressed onboarding (reduced from 5 screens to 2 screens to reduce 77% bounce rate)
- PostSessionSetup: PIN and About Me prompts deferred until after first completed session
- "Keep going" feature: when user says "Not yet" to clarity check, session continues with 3 bonus exchanges
- Demo mode at /demo for expo use — loops through 3 scenarios (work overwhelm, burnout, carer stress)
- Expo at Herefordshire Means Business (April 30, 2026) received strong positive reviews
- Founders Factory Healthcare AI pitch deck created (US market entry)
- Bethnal Green Ventures identified as UK social impact funding route
- B2B licensing model designed: per-org pricing by active user tiers for NHS, EAPs, charities

## Users
- Primary: individuals experiencing work stress, burnout, overwhelm, carer fatigue
- Secondary: people on NHS therapy waiting lists needing support in the gap
- Tertiary: organisations (NHS Trusts, EAPs, charities) licensing for their populations
- Validated at expo: business owners, employees, potential SAS personnel, aging population in Herefordshire

## Constraints
- Solo founder (Wale Koleosho), limited development bandwidth
- No external funding yet — bootstrapped
- API costs scale with usage (Anthropic Claude per-session)
- Client-side rate limiting only (3 sessions in 2 hours, bypassable)
- No retention cohort data — can count events but can't trace user journeys
- No AI quality evaluation framework
- No uptime monitoring
- localStorage persistence means no cross-device sync
- PRD is stale (v1.7, February 2026) — several features not documented

## Open Questions
- Should MindM8 add a reflection sharing feature (AI-summarised takeaways shared via WhatsApp)?
- What's the right daily engagement model? (Spotify Wrapped insights vs Wordle-style daily prompt vs neither)
- How to measure retention without compromising privacy (no user IDs)?
- When to pursue NHS pilot partnerships?
- Founders Factory (US entry) vs Bethnal Green Ventures (UK social impact) — funding route priority

## Recent Decisions
- Compressed onboarding from 5→2 screens to reduce bounce rate
- Moved session mode buttons above nudge cards on home screen for immediate value exposure
- Deferred PIN/profile setup to after first session (PostSessionSetup)
- Added "Keep going" option when users say "Not yet" to clarity check
- Built demo mode for expo use
- Decided NOT to implement sharing or daily engagement features until validated at expo
- Rotating Anthropic API key after exposure in chat context
- CareReady (inspection readiness for domiciliary care) is a separate venture, not part of MindM8
