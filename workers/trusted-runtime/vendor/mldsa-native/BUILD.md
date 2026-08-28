# ML-DSA-65 Wasm build record

This directory contains the approved portable `mldsa-native` build. It is not
an npm dependency and it does not load code from a CDN.

| Input | Pinned value |
|---|---|
| Source | `https://github.com/pq-code-package/mldsa-native.git` |
| Source commit | `6d661fd1865b38d8612692c52160cf76193785fb` |
| Toolchain | Official Zig 0.15.2 for Windows x86-64 |
| Toolchain archive SHA-256 | `3A0ED1E8799A2F8CE2A6E6290A9FF22E6906F8227865911FB7DDEDC3CC14CB0C` |
| Wasm bytes | 40,843 |
| Wasm SHA-256 | `960EA1D9CEB0449F91301CB4168DB83AB1CBA3F0A86FA1BED0515F880B85F802` |
| License | Apache-2.0 OR ISC OR MIT |

The build is portable C, ML-DSA-65 only, core API only, with randomized API
entry points and assembly disabled. The module imports nothing. It exports only
its memory, one fixed arena, key expansion, digest signing, digest verification,
and explicit memory wiping.

Run `scripts/rebuild-mldsa-wasm.ps1 -OutputPath <path>` on Windows to clone the
exact source, download and verify the exact toolchain, rebuild without a cache,
and reject any output that differs from the recorded size or hash.

The Phase -1D evidence used official NIST ACVP v1.1.0.43 and passed all 340
applicable ML-DSA-65 key-generation, signature-generation, and signature-
verification cases. Task 0.8 repeats the vector and independent cross-check
gates. This evidence does not establish a formal end-to-end constant-time proof.
