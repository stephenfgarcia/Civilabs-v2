"use client";

interface ActivityHeatmapProps {
  data: number[][]; // 7 rows (days) × 24 cols (hours)
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getIntensity(value: number, max: number): string {
  if (max === 0 || value === 0) return "bg-gray-100";
  const ratio = value / max;
  if (ratio > 0.75) return "bg-green-600";
  if (ratio > 0.5) return "bg-green-500";
  if (ratio > 0.25) return "bg-green-400";
  if (ratio > 0.1) return "bg-green-300";
  return "bg-green-200";
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const maxValue = Math.max(...data.flat());

  return (
    <div className="space-y-2">
      {/* Hour labels */}
      <div className="flex ml-10">
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} className="flex-1 text-center text-[9px] text-muted-foreground">
            {i % 3 === 0 ? `${i}` : ""}
          </div>
        ))}
      </div>

      {/* Grid */}
      {data.map((row, dayIndex) => (
        <div key={dayIndex} className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground w-8 text-right">{DAYS[dayIndex]}</span>
          <div className="flex flex-1 gap-[1px]">
            {row.map((value, hourIndex) => (
              <div
                key={hourIndex}
                className={`flex-1 h-4 rounded-sm ${getIntensity(value, maxValue)} transition-colors`}
                title={`${DAYS[dayIndex]} ${hourIndex}:00 — ${value} activities`}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-2">
        <span className="text-xs text-muted-foreground mr-1">Less</span>
        <div className="w-3 h-3 rounded-sm bg-gray-100" />
        <div className="w-3 h-3 rounded-sm bg-green-200" />
        <div className="w-3 h-3 rounded-sm bg-green-400" />
        <div className="w-3 h-3 rounded-sm bg-green-600" />
        <span className="text-xs text-muted-foreground ml-1">More</span>
      </div>
    </div>
  );
}
