/**
 * Keyframes demo components.
 * Defines scoped animations with the keyframes helper.
 */
import { keyframes, styled } from "@alex.radulescu/styled-static";

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

export const KeyframeStyles = () => null;

export const Spinner = styled.div`
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-primary);
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

export const PulsingDot = styled.div`
  width: 12px;
  height: 12px;
  background: var(--color-primary);
  border-radius: 50%;
  animation: ${pulse} 2s ease-in-out infinite;
`;
