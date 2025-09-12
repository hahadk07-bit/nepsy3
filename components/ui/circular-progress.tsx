"use client";

interface CircularProgressProps {
  timeLeft: number;
  totalTime: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function CircularProgress({
  timeLeft,
  totalTime,
  size = 80,
  strokeWidth = 6,
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (totalTime - timeLeft) / totalTime;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - progress * circumference;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-linear ${
            timeLeft <= 30 ? "text-red-500" : "text-blue-500"
          }`}
        />
      </svg>
      {/* Time text in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div
            className={`text-lg font-bold ${
              timeLeft <= 30 ? "text-red-500" : "text-gray-700"
            }`}
          >
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>
    </div>
  );
}
