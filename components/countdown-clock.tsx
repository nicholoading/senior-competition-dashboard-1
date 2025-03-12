"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const COUNTDOWN_DURATION = 2 * 60 * 60 * 1000; // 3 hours in milliseconds

const calculateTimeLeft = (endTime: number) => {
  const difference = endTime - Date.now();

  if (difference > 0) {
    return {
      hours: Math.floor(difference / (1000 * 60 * 60)),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  return null;
};

interface CountdownClockProps {
  teamName: string;
}

export function CountdownClock({ teamName }: CountdownClockProps) {
  const [isClient, setIsClient] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    setIsClient(true);

    const fetchStatus = async () => {
      // 1️⃣ Get all groupings for this team
      const { data: groupingData, error: groupingError } = await supabase
        .from("teamGroupings")
        .select("grouping")
        .eq("teamName", teamName);

      if (groupingError || !groupingData || groupingData.length === 0) {
        setIsActive(false);
        return;
      }

      // 2️⃣ Check if **any** of these groupings are active
      const groupingNames = groupingData.map((g) => g.grouping);
      const { data: activeGroupings, error: statusError } = await supabase
        .from("groupingStatus")
        .select("grouping, status, updatedAt")
        .in("grouping", groupingNames)
        .eq("status", "active");

      if (statusError || !activeGroupings || activeGroupings.length === 0) {
        setIsActive(false);
        return;
      }

      setIsActive(true);

      // 3️⃣ Find the **earliest** active session start time (to prevent conflicts)
      const earliestStartTimeUTC = activeGroupings
        .map((g) => new Date(g.updatedAt))
        .sort((a, b) => a.getTime() - b.getTime())[0];

      // Convert UTC `updatedAt` to Kuala Lumpur time
      const startTimeKL = new Date(earliestStartTimeUTC.getTime() + 8 * 60 * 60 * 1000);
      const calculatedEndTime = startTimeKL.getTime() + COUNTDOWN_DURATION;
      setEndTime(calculatedEndTime);

      // 4️⃣ Update countdown timer
      const updateCountdown = () => {
        const timeRemaining = calculateTimeLeft(calculatedEndTime);
        setTimeLeft(timeRemaining);

        // If countdown reaches zero, reload the page
        if (!timeRemaining) {
          window.location.reload();
        }
      };

      updateCountdown();
      const timer = setInterval(updateCountdown, 1000);

      return () => clearInterval(timer);
    };

    fetchStatus();
  }, [teamName]);

  if (!isClient || !isActive || !endTime || !timeLeft) {
    return null; // 🔥 Completely hide the clock if not active
  }

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
      <div className="p-2">
        <h2 className="text-lg font-bold mb-2">Competition Countdown</h2>
        <div className="space-y-0.5">
          <div className="text-3xl font-bold tracking-tight leading-none">
            {timeLeft.hours.toString().padStart(2, "0")}:
            {timeLeft.minutes.toString().padStart(2, "0")}:
            {timeLeft.seconds.toString().padStart(2, "0")}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Time Left in Competition</p>
        </div>
      </div>
    </div>
  );
}