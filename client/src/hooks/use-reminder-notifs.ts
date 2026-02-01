import { useEffect, useRef } from "react";
import type { Reminder } from "@shared/schema";

const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function useReminderNotifications(reminders: Reminder[] | undefined) {
  const firedToday = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!reminders) return;

    // Request permission on first run
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    const checkReminders = () => {
      if (Notification.permission !== "granted") return;

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const currentDay = days[now.getDay()];
      const todayKey = now.toISOString().split("T")[0]; // YYYY-MM-DD

      reminders.forEach((reminder) => {
        if (!reminder.enabled) return;
        new Notification("Test", { body: "This is a test notification" });

        const reminderDays = (reminder.days as string[]) || [];
        const key = `${reminder.id}-${todayKey}`;

        if (
          reminder.time === currentTime &&
          reminderDays.includes(currentDay) &&
          !firedToday.current.has(key)
        ) {
          firedToday.current.add(key);
          new Notification(reminder.title, {
            body: `It's time for your ${reminder.type} reminder.`,
          });
        }
      });
    };

    checkReminders(); // Run immediately on mount
    const interval = setInterval(checkReminders, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [reminders]);
}