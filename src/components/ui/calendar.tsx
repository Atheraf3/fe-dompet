import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, formatMonthYear, toDateKey } from '@/lib/utils';

export interface DateRangeValue {
  from: string;
  to: string;
}

interface CalendarSingleProps {
  mode?: 'single';
  selected?: string;
  onSelect?: (dateKey: string) => void;
  className?: string;
}

interface CalendarRangeProps {
  mode: 'range';
  selected: DateRangeValue;
  onSelect: (range: DateRangeValue) => void;
  className?: string;
}

export type CalendarProps = CalendarSingleProps | CalendarRangeProps;

const HARI_SINGKAT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export function Calendar(props: CalendarProps) {
  const initialDate = React.useMemo(() => {
    if (props.mode === 'range' && props.selected?.from) {
      return new Date(props.selected.from);
    }
    if (props.mode !== 'range' && props.selected) {
      return new Date(props.selected);
    }
    return new Date();
  }, []);

  const [viewMonth, setViewMonth] = React.useState(
    () => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );
  const [rangeStep, setRangeStep] = React.useState<'start' | 'end'>('start');

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<{ key: string; day: number } | null> = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const key = toDateKey(new Date(year, month, day));
    cells.push({ key, day });
  }

  const handleDayClick = (dateKey: string) => {
    if (props.mode === 'range') {
      if (rangeStep === 'start' || dateKey < props.selected.from) {
        props.onSelect({ from: dateKey, to: dateKey });
        setRangeStep('end');
      } else {
        props.onSelect({ from: props.selected.from, to: dateKey });
        setRangeStep('start');
      }
    } else {
      props.onSelect?.(dateKey);
    }
  };

  return (
    <div className={cn('w-full select-none p-1', props.className)}>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewMonth(new Date(year, month - 1, 1))}
          aria-label="Bulan sebelumnya"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-foreground">
          {formatMonthYear(viewMonth)}
        </span>
        <button
          type="button"
          onClick={() => setViewMonth(new Date(year, month + 1, 1))}
          aria-label="Bulan berikutnya"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center">
        {HARI_SINGKAT.map((h) => (
          <span key={h} className="py-1 text-[11px] font-medium text-muted-foreground">
            {h}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (!cell) {
            return <div key={`empty-${idx}`} className="h-9" />;
          }

          let isSelected = false;
          let isInRange = false;

          if (props.mode === 'range') {
            isSelected =
              cell.key === props.selected.from || cell.key === props.selected.to;
            isInRange =
              cell.key > props.selected.from && cell.key < props.selected.to;
          } else {
            isSelected = cell.key === props.selected;
          }

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => handleDayClick(cell.key)}
              className={cn(
                'flex h-9 w-full items-center justify-center rounded-lg text-xs font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isSelected
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : isInRange
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-secondary text-foreground'
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
