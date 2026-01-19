"use client";

import { useState, useEffect } from "react";

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const targetDate = new Date("2026-02-15T00:00:00").getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-12">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="bg-white rounded-xl shadow-lg p-6 min-w-[100px] text-center">
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-300">
                00
              </div>
            </div>
            <div className="mt-3 text-sm sm:text-base font-medium text-gray-400 uppercase tracking-wider">
              ...
            </div>
          </div>
        ))}
      </div>
    );
  }

  const CountdownBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-white rounded-xl shadow-lg p-6 min-w-[100px] text-center transform transition-all hover:scale-105">
        <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-orange-500">
          {String(value).padStart(2, "0")}
        </div>
      </div>
      <div className="mt-3 text-sm sm:text-base font-medium text-gray-600 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-12">
      <CountdownBox value={timeLeft.days} label="Días" />
      <CountdownBox value={timeLeft.hours} label="Horas" />
      <CountdownBox value={timeLeft.minutes} label="Minutos" />
      <CountdownBox value={timeLeft.seconds} label="Segundos" />
    </div>
  );
}

