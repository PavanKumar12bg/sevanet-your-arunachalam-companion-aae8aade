// Shared audio focus manager. The Girivalam Tracker requests focus while
// playing GPS-triggered guidance audio; SevaNet's global chanting player
// listens and pauses while focus is held, then resumes when released.

type Listener = (active: boolean) => void;

const listeners = new Set<Listener>();
let depth = 0; // ref-count so overlapping requests still resume correctly

function emit() {
  for (const l of listeners) {
    try { l(depth > 0); } catch {}
  }
}

export const audioFocus = {
  request() {
    depth += 1;
    if (depth === 1) emit();
  },
  release() {
    depth = Math.max(0, depth - 1);
    if (depth === 0) emit();
  },
  reset() {
    if (depth === 0) return;
    depth = 0;
    emit();
  },
  isActive() {
    return depth > 0;
  },
  subscribe(l: Listener) {
    listeners.add(l);
    l(depth > 0);
    return () => listeners.delete(l);
  },
};
