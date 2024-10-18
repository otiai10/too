/**
 *
 */
const BLACK = "\u001b[30m";
const RED = "\u001b[31m";
const GREEN = "\u001b[32m";
const YELLOW = "\u001b[33m";
const BLUE = "\u001b[34m";
const MAGENDA = "\u001b[35m";
const CYAN = "\u001b[36m";
const WHITE = "\u001b[37m";
const RESET = "\u001b[0m";

const BOLD = "\u001b[1m";
const UNDERLINE = "\u001b[4m";
const REVERSED = "\u001b[7m";

const colors = [
  GREEN,
  CYAN,
  YELLOW,
  MAGENDA,
  BLUE,
];

export function getColorByIndex(index: number): string {
  return colors[index % colors.length];
}

export {
  BLACK,
  RED,
  GREEN,
  YELLOW,
  BLUE,
  MAGENDA,
  CYAN,
  WHITE,
  RESET,
  BOLD,
  UNDERLINE,
  REVERSED,
}