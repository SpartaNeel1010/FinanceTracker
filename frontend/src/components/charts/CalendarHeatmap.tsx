'use client';
import { useState } from 'react';
import { subDays, format, eachDayOfInterval, startOfDay } from 'date-fns';

interface Props {
  data: Record<string, number>;
}

function getColor(value: number, max: number): string {
  if (value === 0) return 'var(--muted)';
  const ratio = value / max;
  if (ratio < 0.25) return 'rgba(0, 82, 255, 0.2)';
  if (ratio < 0.5) return 'rgba(0, 82, 255, 0.45)';
  if (ratio < 0.75) return 'rgba(0, 82, 255, 0.7)';
  return 'rgba(0, 82, 255, 0.95)';
}

export default function CalendarHeatmap({ data }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; value: number } | null>(null);

  const today = new Date();
  const days = eachDayOfInterval({ start: subDays(today, 89), end: today });
  const maxValue = Math.max(...Object.values(data), 1);

  // Group by week
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  days.forEach((day, i) => {
    currentWeek.push(day);
    if (day.getDay() === 6 || i === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: '3px', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingTop: '20px' }}>
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <div key={d} style={{
              height: '14px', width: '24px', fontSize: '9px',
              color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center',
            }}>
              {d % 2 === 1 ? dayLabels[d] : ''}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {/* Month label */}
            <div style={{ height: '16px', fontSize: '9px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
              {week[0] && week[0].getDate() <= 7 ? format(week[0], 'MMM') : ''}
            </div>
            {/* Pad start of week */}
            {wi === 0 && week[0].getDay() > 0 && Array.from({ length: week[0].getDay() }).map((_, i) => (
              <div key={`pad-${i}`} style={{ width: '14px', height: '14px' }} />
            ))}
            {week.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const value = data[key] || 0;
              return (
                <div
                  key={key}
                  className="heatmap-cell"
                  style={{
                    width: '14px',
                    height: '14px',
                    background: getColor(value, maxValue),
                    border: `1px solid ${value > 0 ? 'rgba(0,0,0,0.06)' : 'var(--border)'}`,
                  }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({ x: rect.left, y: rect.top, date: key, value });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.75rem' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>Less</span>
        {[0.1, 0.3, 0.55, 0.75, 1].map((op) => (
          <div key={op} style={{
            width: '12px', height: '12px', borderRadius: '2px',
            background: op === 0.1 ? 'var(--muted)' : `rgba(0,82,255,${op})`,
          }} />
        ))}
        <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 20,
          top: tooltip.y - 10,
          background: 'var(--foreground)',
          color: 'white',
          padding: '0.4rem 0.6rem',
          borderRadius: '0.375rem',
          fontSize: '0.75rem',
          zIndex: 999,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}>
          <div>{tooltip.date}</div>
          <div>${tooltip.value.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
}
