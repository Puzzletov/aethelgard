# aethelgard
Privacy-first AI document intelligence platform built as an enterprise engineering showcase.

Development and clean-machine recovery instructions are in [RECOVERY.md](RECOVERY.md).
Signing-key publication and retained-key handling are documented in
[KEY_ROTATION.md](KEY_ROTATION.md).

Verify any downloaded report independently with Node 24 or newer:

```text
npm run verify:report -- report.pdf report.sig.json signing-keys.json
```
