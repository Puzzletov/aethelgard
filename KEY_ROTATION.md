# Signing-key rotation

The published key document is `frontend/public/signing-keys.json`. It contains
public verification material only and is limited to 16 retained keys across
both algorithms.

Rotation is an owner-reviewed production operation:

1. Generate a new key pair with `npm run keys:generate -- --upload-reviewed
   --public-output <new-file>` only during the reviewed release window.
2. Verify the new public-key IDs against the production signer without printing
   or storing private values outside Cloudflare secrets.
3. Add each new public entry with status `current`; change the preceding entries
   to `retired` instead of deleting them.
4. Run both browser and CLI verifier matrices against current and retained keys.
5. Promote the static key document and private signer together, then verify a
   live synthetic PDF before completing release.

Never overwrite an identifier, silently remove a retired key, commit private or
seed material, or exceed the 32,768-byte document and 16-key bounds. Exceeding a
bound requires owner-reviewed retirement planning before rotation.
