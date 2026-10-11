"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ActionResult } from "@/types";

export type SaveStatus = "idle" | "saving" | "saved" | "error";
type Task = () => Promise<ActionResult>;

/**
 * 키별 디바운스 자동 저장.
 * - 같은 키의 요청은 순서대로 보낸다(늦게 보낸 값이 먼저 저장되는 일 방지)
 * - 화면을 떠나거나 앱을 내릴 때는 기다리지 않고 바로 저장한다
 */
export function useAutosave(delay = 700) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timers = useRef(new Map<string, { timer: ReturnType<typeof setTimeout>; task: Task }>());
  const chains = useRef(new Map<string, Promise<void>>());
  const failed = useRef(new Map<string, Task>());
  const inflight = useRef(0);

  const settle = useCallback(() => {
    if (inflight.current === 0 && timers.current.size === 0) {
      setStatus(failed.current.size > 0 ? "error" : "saved");
    }
  }, []);

  const saveNow = useCallback(
    (key: string, task: Task) => {
      const pending = timers.current.get(key);
      if (pending) {
        clearTimeout(pending.timer);
        timers.current.delete(key);
      }
      inflight.current += 1;
      setStatus("saving");
      const previous = chains.current.get(key) ?? Promise.resolve();
      const next = previous
        .then(async () => {
          let ok = false;
          try {
            ok = (await task()).ok;
          } catch {
            ok = false;
          }
          if (ok) failed.current.delete(key);
          else failed.current.set(key, task);
        })
        .finally(() => {
          inflight.current -= 1;
          settle();
        });
      chains.current.set(key, next);
    },
    [settle],
  );

  const schedule = useCallback(
    (key: string, task: Task, wait = delay) => {
      const pending = timers.current.get(key);
      if (pending) clearTimeout(pending.timer);
      setStatus("saving");
      const timer = setTimeout(() => {
        timers.current.delete(key);
        saveNow(key, task);
      }, wait);
      timers.current.set(key, { timer, task });
    },
    [delay, saveNow],
  );

  const flush = useCallback(() => {
    for (const [key, { task }] of [...timers.current]) saveNow(key, task);
  }, [saveNow]);

  const retry = useCallback(() => {
    for (const [key, task] of [...failed.current]) saveNow(key, task);
  }, [saveNow]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);

  return { status, schedule, saveNow, retry };
}
