"use client";

import { useEffect } from "react";

type ViewTrackerProps = {
  path: string;
  postId?: string;
};

export function ViewTracker({ path, postId }: ViewTrackerProps) {
  useEffect(() => {
    const key = `fadoblog-view:${path}:${postId ?? "page"}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    fetch("/api/analytics/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, postId }),
      keepalive: true,
    }).catch(() => undefined);
  }, [path, postId]);

  return null;
}
