# Implementation ledger

Approved: P0-P2, Windows first, independent product copies of owned scripts, forward OneBot WS.
User update: do not distribute Heybox signing or platform internal constants. Keep BYO CLI adapter only; document its external contract. Owned signature implementation confirmed original, but explicitly excluded from public distribution.
Source deployment is read-only. Never inspect dsh-onebot-qq source. No publishing or deployment switch.

## Work
- [x] Core configuration, persona, writings, adapters, tests
- [x] Host lifecycle/session integration and React panel
- [x] Configurable owned MC toolchain, safe world lifecycle, body editing
- [x] Forward OneBot and channel-bound conversation routing
- [x] BYO Heybox adapter, owned Bilibili toolchain, credentials, optional media
- [x] Migration, scheduler, localization and documentation
- [x] Actual package, browser, isolated host/runtime verification

## Verification boundary
- 51 behavioral tests; 11 standalone browser scenarios; 6 onboarding browser scenarios; 7 actual official-download preparation checks. Actual host API/browser/lifecycle checks are recorded separately for the installed package.
- Actual host runs use a local fixture model and a synthetic OneBot endpoint. This is not real-account acceptance.
- Minecraft uses an isolated local Java server and a real mineflayer body; source jar hash is checked and test processes are cleaned.
- Another Windows machine/user, real model/NapCat/platform credentials and third-party plugin combinations remain pending. See docs/verification.md.
- Production dependency audit: 8 moderate, 0 high, 0 critical. No public publishing, repository push or live deployment switch performed.

## 0.2.0 onboarding
- User explicitly authorized optional official Java/Minecraft/NapCat downloads after in-product confirmation. Distribution exclusions and the Heybox signing exclusion remain in force.
- Default channel cards now use guides. Advanced fields, diagnostics and existing-deployment access remain available.
- Real isolated preparation downloaded portable Java and server jar, started a new world, joined with a real body, observed the world, downloaded/extracted the QQ installer and fetched a real Bilibili login QR code. Test world stopped normally.
- No real QQ installer/login or Bilibili account confirmation was performed. See docs/onboarding.md and docs/verification.md.

## Known environment

## 0.3.0 revision
- R1 pins the reviewed NapCat release; mismatched version/asset/digest is refused before download. Execution requires confirmation and Valid Authenticode with the exact publisher. The reviewed real installer is NotSigned, so the shipping UI is manual-install only.
- R2 computes the default from the live Mojang release list and actual minecraft-data support. Real 26.1 plus the official Java 25 runtime passed start/join/observe/stop. 26.3 is clearly marked server-only.
- R3 supports managed / LAN / existing folder. Shared bounded UDP discovery replaces the body implementation. Existing EULA bytes remain unchanged. Real server/body LAN integration uses an explicitly synthetic announcement; actual game-client LAN remains pending.
- R4 checks public host model metadata and recent successful turns; missing evidence stays unknown. Opening a role checks freshly and blocks known missing login/model. No extra model key or paid probe.
- R5 adds anchor/guard/version audits with negative regression tests. 65 unit tests, 11 base browser cases, 11 onboarding cases, host API 15, host browser 5, lifecycle 11 and legacy real-world/body-workflow 18 passed.
- Protected files: all 57 baseline hashes and the QQ/Bili/Heybox adapter section remain unchanged. 54 provenance entries remain. Production audit remains 8 moderate, 0 high/critical.
- Actual 0.3.0 tarball installed 126 production packages in a new isolated directory. Existing manual-home data is preserved; the manual launcher now points to 0.3.0. New machine, real account and actual game-client acceptance remain pending.
- Installed DSH: A:/AI/DSH/resources/app.asar; host packages 0.2.1-rc.3.
- Host docs: sessionController.create may return a NEW identity for an existing nonblank id. Persist actual identity; do not recreate existing sessions.
- Host Agent.followup supports custom MessageSource kinds; world events must retain plugin origin.
- Electron process.execPath cannot be used as node. Host bundled runtime is available.
- Current world.mjs status mutates state; do not run it against the live deployment.
- Existing mc-up.ps1 already delegates to world.mjs up.
