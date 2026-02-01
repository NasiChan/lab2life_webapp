import { useEffect, useRef } from "react";
import type { Medication, Supplement } from "@shared/schema";

const timeBlockTriggers: Record<string, string> = {
  morning: "06:00",
  midday: "11:00",
  evening: "15:00",
  bedtime: "20:00",
};

const SNOOZE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export function usePillNotifications(
  medications: Medication[],
  supplements: Supplement[]
) {
  const firedToday = useRef<Set<string>>(new Set());
  const snoozedPills = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const snoozePill = (timeBlock: string, pillNames: string) => {
    const key = `pills-${timeBlock}-${new Date().toISOString().split("T")[0]}`;

    // Remove from firedToday so it can fire again
    firedToday.current.delete(key);

    // Clear any existing snooze timer for this block
    if (snoozedPills.current.has(key)) {
      clearTimeout(snoozedPills.current.get(key)!);
    }

    // Set a 10 minute timer to re-notify
    const timeout = setTimeout(() => {
      new Notification(`Time for your ${timeBlock} pills (snoozed)`, {
        body: pillNames,
      });
      snoozedPills.current.delete(key);
    }, SNOOZE_DURATION_MS);

    snoozedPills.current.set(key, timeout);
  };

  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    const checkPills = () => {
      if (Notification.permission !== "granted") return;

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const todayKey = now.toISOString().split("T")[0];

      const allPills = [
        ...medications.filter((m) => m.active).map((m) => ({
          id: m.id,
          type: "medication" as const,
          name: m.name,
          timeBlock: m.timeBlock || "morning",
        })),
        ...supplements.filter((s) => s.active).map((s) => ({
          id: s.id,
          type: "supplement" as const,
          name: s.name,
          timeBlock: s.timeBlock || "morning",
        })),
      ];

      const grouped = new Map<string, typeof allPills>();
      allPills.forEach((pill) => {
        const existing = grouped.get(pill.timeBlock) || [];
        existing.push(pill);
        grouped.set(pill.timeBlock, existing);
      });

      grouped.forEach((pills, timeBlock) => {
        const triggerTime = timeBlockTriggers[timeBlock];
        if (!triggerTime) return;

        const key = `pills-${timeBlock}-${todayKey}`;

        if (currentTime === triggerTime && !firedToday.current.has(key)) {
          firedToday.current.add(key);
          const pillNames = pills.map((p) => p.name).join(", ");
          new Notification(`Time for your ${timeBlock} pills`, {
            body: pillNames,
          });
        }
      });
    };

    checkPills();
    const interval = setInterval(checkPills, 30000);

    return () => {
      clearInterval(interval);
      snoozedPills.current.forEach((timeout) => clearTimeout(timeout));
      snoozedPills.current.clear();
    };
  }, [medications, supplements]);

  return { snoozePill };
}
