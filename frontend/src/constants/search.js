// Wait this long after the last keystroke before a search dropdown asks the API again.
// Shared by every search dropdown; NEXT_PUBLIC_ so it is inlined into the browser bundle.
export const SEARCH_DEBOUNCE_MS = Number(process.env.NEXT_PUBLIC_SEARCH_DEBOUNCE_MS) || 800;
