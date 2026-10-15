// Standard Page Visibility/Page Lifecycle events, not proprietary Meta APIs.
export function attachLifecycle(doc: Document, win: Window, suspend: () => void): () => void {
  const visibility = () => {if (doc.hidden) suspend();};
  const pagehide = () => suspend();
  doc.addEventListener('visibilitychange', visibility);
  win.addEventListener('pagehide', pagehide);
  return () => {doc.removeEventListener('visibilitychange', visibility); win.removeEventListener('pagehide', pagehide);};
}
