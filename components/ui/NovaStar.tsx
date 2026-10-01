import type { SVGProps } from "react";

/**
 * The NOVA mark: a four-point star with concave edges.
 * Used in the wordmark, as the loading spinner and in empty states, nowhere else.
 */
export function NovaStar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d="M12 0C12.7 7.3 16.7 11.3 24 12C16.7 12.7 12.7 16.7 12 24C11.3 16.7 7.3 12.7 0 12C7.3 11.3 11.3 7.3 12 0Z" />
    </svg>
  );
}
