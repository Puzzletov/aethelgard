export const MLDSA65_PUBLIC_KEY_BYTES = 1_952;
export const MLDSA65_SECRET_KEY_BYTES = 4_032;
export const MLDSA65_SIGNATURE_BYTES = 3_309;
export const MLDSA65_SEED_BYTES = 32;
export const MLDSA65_RANDOM_BYTES = 32;
const DIGEST_BYTES = 32;
const ARENA_BYTES = 16_384;

interface MldsaExports extends WebAssembly.Exports {
  readonly memory: WebAssembly.Memory;
  phase1d_arena_ptr(): number;
  phase1d_keypair(seed: number, publicKey: number, secretKey: number): number;
  phase1d_sign(digest: number, secretKey: number, random: number, signature: number): number;
  phase1d_verify(signature: number, digest: number, publicKey: number): number;
  phase1d_wipe(pointer: number, length: number): void;
}

interface Arena {
  readonly base: number;
  readonly digest: number;
  readonly publicKey: number;
  readonly random: number;
  readonly secretKey: number;
  readonly signature: number;
}

function arenaAt(base: number): Arena {
  const publicKey = base + MLDSA65_SEED_BYTES;
  const secretKey = publicKey + MLDSA65_PUBLIC_KEY_BYTES;
  const random = secretKey + MLDSA65_SECRET_KEY_BYTES;
  const digest = random + MLDSA65_RANDOM_BYTES;
  return { base, publicKey, secretKey, random, digest, signature: digest + DIGEST_BYTES };
}

function requireLength(name: string, bytes: Uint8Array, expected: number): void {
  if (bytes.byteLength !== expected) throw new Error(`${name} has an invalid length.`);
}

export class Mldsa65 {
  private readonly instance: Promise<WebAssembly.Instance>;

  constructor(module: WebAssembly.Module) {
    this.instance = WebAssembly.instantiate(module);
  }

  private async exports(): Promise<MldsaExports> {
    return (await this.instance).exports as MldsaExports;
  }

  async publicKeyFromSeed(seed: Uint8Array): Promise<Uint8Array> {
    requireLength("ML-DSA-65 seed", seed, MLDSA65_SEED_BYTES);
    const wasm = await this.exports();
    const arena = arenaAt(wasm.phase1d_arena_ptr());
    const memory = new Uint8Array(wasm.memory.buffer);
    try {
      memory.set(seed, arena.base);
      if (wasm.phase1d_keypair(arena.base, arena.publicKey, arena.secretKey) !== 0) {
        throw new Error("ML-DSA-65 key expansion failed.");
      }
      return memory.slice(arena.publicKey, arena.publicKey + MLDSA65_PUBLIC_KEY_BYTES);
    } finally {
      wasm.phase1d_wipe(arena.base, ARENA_BYTES);
    }
  }

  async signDigest(seed: Uint8Array, digest: Uint8Array, random: Uint8Array): Promise<{
    readonly publicKey: Uint8Array;
    readonly signature: Uint8Array;
  }> {
    requireLength("ML-DSA-65 seed", seed, MLDSA65_SEED_BYTES);
    requireLength("SHA-256 digest", digest, DIGEST_BYTES);
    requireLength("ML-DSA-65 randomness", random, MLDSA65_RANDOM_BYTES);
    const wasm = await this.exports();
    const arena = arenaAt(wasm.phase1d_arena_ptr());
    const memory = new Uint8Array(wasm.memory.buffer);
    try {
      memory.set(seed, arena.base);
      memory.set(random, arena.random);
      memory.set(digest, arena.digest);
      if (wasm.phase1d_keypair(arena.base, arena.publicKey, arena.secretKey) !== 0) {
        throw new Error("ML-DSA-65 key expansion failed.");
      }
      if (wasm.phase1d_sign(arena.digest, arena.secretKey, arena.random, arena.signature) !== 0) {
        throw new Error("ML-DSA-65 signing failed.");
      }
      if (wasm.phase1d_verify(arena.signature, arena.digest, arena.publicKey) !== 0) {
        throw new Error("ML-DSA-65 self-check failed.");
      }
      return {
        publicKey: memory.slice(arena.publicKey, arena.publicKey + MLDSA65_PUBLIC_KEY_BYTES),
        signature: memory.slice(arena.signature, arena.signature + MLDSA65_SIGNATURE_BYTES),
      };
    } finally {
      wasm.phase1d_wipe(arena.base, ARENA_BYTES);
    }
  }

  async verifyDigest(publicKey: Uint8Array, digest: Uint8Array, signature: Uint8Array): Promise<boolean> {
    requireLength("ML-DSA-65 public key", publicKey, MLDSA65_PUBLIC_KEY_BYTES);
    requireLength("SHA-256 digest", digest, DIGEST_BYTES);
    requireLength("ML-DSA-65 signature", signature, MLDSA65_SIGNATURE_BYTES);
    const wasm = await this.exports();
    const arena = arenaAt(wasm.phase1d_arena_ptr());
    const memory = new Uint8Array(wasm.memory.buffer);
    try {
      memory.set(publicKey, arena.publicKey);
      memory.set(digest, arena.digest);
      memory.set(signature, arena.signature);
      return wasm.phase1d_verify(arena.signature, arena.digest, arena.publicKey) === 0;
    } finally {
      wasm.phase1d_wipe(arena.base, ARENA_BYTES);
    }
  }
}
