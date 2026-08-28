#ifndef PHASE1D_ZEROIZE_H
#define PHASE1D_ZEROIZE_H

#include <stddef.h>
#include <stdint.h>

static inline void mld_zeroize(void *pointer, size_t length) {
  volatile uint8_t *bytes = (volatile uint8_t *)pointer;
  for (size_t index = 0; index < length; index++) bytes[index] = 0U;
}

#endif
