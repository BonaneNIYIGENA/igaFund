/** Chart parameters for the analytics dashboard. */
export const STATUS_COLOR = {
  verified: "#12875A",
  awaiting: "#DFA008",
  changes: "#BE3B2D",
} as const;

/** Magnitude uses one hue, light to dark — never a rainbow. */
export const SEQUENTIAL = {
  hue: "#1E5945",
  fill: "#2F7D5B",
  soft: "#9DD0B6",
} as const;

export const AXIS = {
  line: "#D3E3DA",
  text: "#6E8279",
  grid: "#E6F0EA",
} as const;

export const chartFont = {
  fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
  fontSize: 12,
};
