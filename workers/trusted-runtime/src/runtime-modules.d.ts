declare module "*.wasm" {
  const module: WebAssembly.Module;
  export default module;
}

declare module "node:crypto" {
  interface KeyObject {
    export(options: { readonly format: "der"; readonly type: "spki" }): Uint8Array;
  }

  interface Hash {
    update(data: Uint8Array): Hash;
    digest(): Uint8Array;
    digest(encoding: "hex"): string;
  }

  export function createHash(algorithm: "sha256"): Hash;
  export function createPrivateKey(options: {
    readonly key: Uint8Array;
    readonly format: "der";
    readonly type: "pkcs8";
  }): KeyObject;
  export function createPublicKey(key: KeyObject): KeyObject;
  export function randomBytes(size: number): Uint8Array;
  export function sign(algorithm: null, data: Uint8Array, key: KeyObject): Uint8Array;
  export function verify(
    algorithm: null,
    data: Uint8Array,
    key: KeyObject,
    signature: Uint8Array,
  ): boolean;
}
