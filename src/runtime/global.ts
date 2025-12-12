/**
 * styled-static global styles runtime
 *
 * GlobalStyle component - renders nothing.
 * The CSS is extracted to a static file at build time.
 * This component exists only to provide a familiar API.
 */
import type { ComponentType } from "react";

export const __GlobalStyle: ComponentType<Record<string, never>> = () => null;
