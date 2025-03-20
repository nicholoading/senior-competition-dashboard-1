"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const calculateTimeLeft = (endTime: number) => {
  const difference = endTime - Date.now();

  if (difference > 0) {
    return {
      hours: Math.floor(difference / (1000 * 60 * 60)),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  return null; // Return null when time runs out
};

interface CountdownClockProps {
  teamName: string;
}

export function CountdownClock({ teamName }: CountdownClockProps) {
  const [isClient, setIsClient] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

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

      // 2️⃣ Check if **any** of these groupings are active and fetch targetTime
      const groupingNames = groupingData.map((g) => g.grouping);
      const { data: activeGroupings, error: statusError } = await supabase
        .from("groupingStatus")
        .select("grouping, status, updatedAt, targetTime")
        .in("grouping", groupingNames)
        .eq("status", "active");

      if (statusError || !activeGroupings || activeGroupings.length === 0) {
        setIsActive(false);
        return;
      }

      setIsActive(true);

      // 3️⃣ Find the **earliest** active session start time and its corresponding targetTime
      const earliestSession = activeGroupings
        .map((g) => ({
          updatedAt: new Date(g.updatedAt).getTime(),
          targetTime: g.targetTime || 0, // Use 0 if targetTime is null
        }))
        .sort((a, b) => a.updatedAt - b.updatedAt)[0];

      // Convert UTC `updatedAt` to Kuala Lumpur time (+8 hours)
      const startTimeKL = earliestSession.updatedAt + 8 * 60 * 60 * 1000;
      // Calculate end time by adding targetTime (in seconds) converted to milliseconds
      const calculatedEndTime = startTimeKL + earliestSession.targetTime * 1000;
      setEndTime(calculatedEndTime);

      // 4️⃣ Update countdown timer
      const updateCountdown = () => {
        const timeRemaining = calculateTimeLeft(calculatedEndTime);
        setTimeLeft(timeRemaining);
        // No reload; timeLeft will become null when timer runs out
      };

      updateCountdown();
      const timer = setInterval(updateCountdown, 1000);

      return () => clearInterval(timer);
    };

    fetchStatus();
  }, [teamName]);

  if (!isClient || !isActive || !endTime) {
    return null; // Hide the clock if not active or not yet loaded
  }

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
      <div className="p-2">
        <h2 className="text-lg font-bold mb-2">Competition Countdown</h2>
        <div className="space-y-0.5">
          <div className="text-3xl font-bold tracking-tight leading-none">
            {timeLeft
              ? `${timeLeft.hours.toString().padStart(2, "0")}:${timeLeft.minutes
                  .toString()
                  .padStart(2, "0")}:${timeLeft.seconds.toString().padStart(2, "0")}`
              : "00:00:00"}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Time Left in Competition</p>
        </div>
      </div>
    </div>
  );
}