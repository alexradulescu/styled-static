/**
 * Keyframes demo components.
 * Defines @keyframes via createGlobalStyle (extracted at build time)
 * and references them by name in styled components.
 */
import { createGlobalStyle, styled } from "@alex.radulescu/styled-static";

export const KeyframeStyles = createGlobalStyle`
  @keyframes ss-docs-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes ss-docs-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

export const Spinner = styled.div`
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-primary);
  border-top-color: transparent;
  border-radius: 50%;
  animation: ss-docs-spin 1s linear infinite;
`;

export const PulsingDot = styled.div`
  width: 12px;
  height: 12px;
  background: var(--color-primary);
  border-radius: 50%;
  animation: ss-docs-pulse 2s ease-in-out infinite;
`;
