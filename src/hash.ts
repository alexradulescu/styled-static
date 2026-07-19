/**
 * Generate a deterministic 64-bit FNV-1a hash for CSS and source identifiers.
 *
 * The plugin hashes UTF-8 bytes, so distinct Unicode input is preserved. A
 * 64-bit result makes accidental class-name collisions impractical while
 * keeping generated names short enough to scan in development tools.
 */
export function hash(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let result = 0xcbf29ce484222325n;

  for (const byte of bytes) {
    result ^= BigInt(byte);
    result = BigInt.asUintN(64, result * 0x100000001b3n);
  }

  return result.toString(36).padStart(13, "0");
}
