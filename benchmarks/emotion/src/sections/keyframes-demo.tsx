/**
 * Keyframes demo components.
 * Defines @keyframes via Emotion's keyframes helper
 * and references them in styled components.
 */
import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";

const ssDocsSpin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const ssDocsPulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

export function KeyframeStyles() {
  return null; // keyframes are embedded in styled components below
}

export const Spinner = styled.div`
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-primary);
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${ssDocsSpin} 1s linear infinite;
`;

export const PulsingDot = styled.div`
  width: 12px;
  height: 12px;
  background: var(--color-primary);
  border-radius: 50%;
  animation: ${ssDocsPulse} 2s ease-in-out infinite;
`;
