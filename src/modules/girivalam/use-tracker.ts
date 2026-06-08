import { useEffect, useRef, useState } from "react";
import { GirivalamTracker, type LiveData, type TrackerSnapshot } from "./tracker-service";
import { CloudSync, type CloudSyncState } from "./cloud-sync";

export function useGirivalamTracker() {
  const trackerRef = useRef<GirivalamTracker | null>(null);
  const cloudRef = useRef<CloudSync | null>(null);
  if (!trackerRef.current) trackerRef.current = new GirivalamTracker();
  if (!cloudRef.current) cloudRef.current = new CloudSync();

  const [snapshot, setSnapshot] = useState<TrackerSnapshot>(() => trackerRef.current!.getSnapshot());
  const [live, setLive] = useState<LiveData>(() => trackerRef.current!.getLive());
  const [cloud, setCloud] = useState<CloudSyncState>(() => cloudRef.current!.getState());

  useEffect(() => {
    const tracker = trackerRef.current!;
    const sync = cloudRef.current!;

    const unsubT = tracker.subscribe((s, l) => {
      setSnapshot({ ...s });
      setLive({ ...l });
      sync.push(s);
    });
    const unsubC = sync.subscribe((s) => setCloud({ ...s }));

    sync.init().then((remote) => { if (remote) tracker.applySnapshot(remote); }).catch(() => {});

    tracker.start();
    return () => {
      unsubT();
      unsubC();
      sync.destroy();
      tracker.destroy();
      trackerRef.current = null;
      cloudRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    snapshot, live, cloud,
    pause: () => trackerRef.current?.pause(),
    resume: () => trackerRef.current?.resume(),
    reset: () => trackerRef.current?.reset(),
  };
}
