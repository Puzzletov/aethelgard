/* Aethelgard's minimal import-free ML-DSA-65 Wasm boundary. */
#include <stddef.h>
#include <stdint.h>

#include "mldsa_native.h"

#define PHASE1D_ARENA_BYTES 16384U
#define PHASE1D_HASH_BYTES 32U
#define PHASE1D_PREFIX_BYTES 2U

static uint8_t phase1d_arena[PHASE1D_ARENA_BYTES];

void *memcpy(void *destination, const void *source, size_t length) {
  uint8_t *output = (uint8_t *)destination;
  const uint8_t *input = (const uint8_t *)source;
  for (size_t index = 0; index < length; index++) output[index] = input[index];
  return destination;
}

void *memset(void *destination, int value, size_t length) {
  uint8_t *output = (uint8_t *)destination;
  for (size_t index = 0; index < length; index++) output[index] = (uint8_t)value;
  return destination;
}

uint32_t phase1d_arena_ptr(void) { return (uint32_t)(uintptr_t)phase1d_arena; }

int phase1d_keypair(uint32_t seed_ptr, uint32_t public_ptr,
                    uint32_t secret_ptr) {
  return PQCP_MLDSA_NATIVE_MLDSA65_keypair_internal(
      (uint8_t *)(uintptr_t)public_ptr, (uint8_t *)(uintptr_t)secret_ptr,
      (const uint8_t *)(uintptr_t)seed_ptr);
}

int phase1d_sign(uint32_t hash_ptr, uint32_t secret_ptr, uint32_t random_ptr,
                 uint32_t signature_ptr) {
  static const uint8_t prefix[PHASE1D_PREFIX_BYTES] = {0U, 0U};
  return PQCP_MLDSA_NATIVE_MLDSA65_signature_internal(
      (uint8_t *)(uintptr_t)signature_ptr, (const uint8_t *)(uintptr_t)hash_ptr,
      PHASE1D_HASH_BYTES, prefix, PHASE1D_PREFIX_BYTES,
      (const uint8_t *)(uintptr_t)random_ptr,
      (const uint8_t *)(uintptr_t)secret_ptr, 0);
}

int phase1d_verify(uint32_t signature_ptr, uint32_t hash_ptr,
                   uint32_t public_ptr) {
  static const uint8_t prefix[PHASE1D_PREFIX_BYTES] = {0U, 0U};
  return PQCP_MLDSA_NATIVE_MLDSA65_verify_internal(
      (const uint8_t *)(uintptr_t)signature_ptr,
      (const uint8_t *)(uintptr_t)hash_ptr, PHASE1D_HASH_BYTES, prefix,
      PHASE1D_PREFIX_BYTES, (const uint8_t *)(uintptr_t)public_ptr, 0);
}

void phase1d_wipe(uint32_t pointer, uint32_t length) {
  volatile uint8_t *bytes = (volatile uint8_t *)(uintptr_t)pointer;
  for (uint32_t index = 0; index < length; index++) bytes[index] = 0U;
}
