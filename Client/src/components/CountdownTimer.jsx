import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';

const CountdownTimer = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = expiresAt - Date.now();
      return Math.max(0, Math.floor(difference / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const left = calculateTimeLeft();
      setTimeLeft(left);
      if (left <= 0) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const getColorClass = () => {
    if (timeLeft < 30) return "text-danger countdown-pulse";
    if (timeLeft < 120) return "text-yellow-500";
    return "text-muted";
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={clsx("text-3xl font-mono font-bold transition-colors", getColorClass())}>
        {display}
      </span>
      <span className="text-[10px] uppercase tracking-widest text-muted">Expires In</span>
    </div>
  );
};

export default CountdownTimer;
