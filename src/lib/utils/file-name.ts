// Strip characters that are illegal in Windows/macOS/Linux filenames.
// Hebrew, Latin, digits, spaces, dashes, underscores, dots, parentheses are kept.
const FORBIDDEN = /[<>:"/\\|?*\x00-\x1f]/g;

export function sanitizeFileNameInput(value: string): string {
  return value.replace(FORBIDDEN, "");
}
