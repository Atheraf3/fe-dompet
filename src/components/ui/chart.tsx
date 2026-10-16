import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import { cn, formatRupiah } from '@/lib/utils';

export type ChartConfig = Record<
  string,
  {
    label: string;
    color: string;
  }
>;

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children'];
}

export function ChartContainer({
  config,
  className,
  children,
  ...props
}: ChartContainerProps) {
  const cssVars = React.useMemo(() => {
    const vars: Record<string, string> = {};
    for (const [key, val] of Object.entries(config)) {
      vars[`--color-${key}`] = val.color;
    }
    return vars as React.CSSProperties;
  }, [config]);

  return (
    <div
      style={cssVars}
      className={cn('flex aspect-square w-full justify-center text-xs', className)}
      {...props}
    >
      <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
        {children}
      </RechartsPrimitive.ResponsiveContainer>
    </div>
  );
}

export const ChartTooltip = RechartsPrimitive.Tooltip;

export function ChartTooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    payload?: { name?: string; color_code?: string; percentage?: number };
  }>;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const item = payload[0];
  const color = item.payload?.color_code || '#0f766e';
  const pct = item.payload?.percentage ?? 0;

  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <div className="flex items-center gap-2 font-semibold">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span>{item.name}</span>
      </div>
      <div className="mt-1 font-mono font-semibold tabular-nums">
        {formatRupiah(Number(item.value || 0))} ({pct}%)
      </div>
    </div>
  );
}

export function ChartLegend({
  items,
}: {
  items: Array<{
    category_id: string;
    name: string;
    color_code: string;
    percentage: number;
  }>;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
      {items.map((item) => (
        <div key={item.category_id} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: item.color_code }}
          />
          <span className="font-medium text-foreground">{item.name}</span>
          <span className="font-mono text-muted-foreground tabular-nums">
            {item.percentage}%
          </span>
        </div>
      ))}
    </div>
  );
}
