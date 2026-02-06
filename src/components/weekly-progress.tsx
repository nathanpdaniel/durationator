"use client";

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isWithinInterval } from 'date-fns';

type Duration = {
  id: number;
  hours: string;
  minutes: string;
  createdAt: Date;
};

type WeeklyProgressProps = {
  durations: Duration[];
  weeklyTargetHours: string;
  onWeeklyTargetChange: (value: string) => void;
};

const formatWeeklyDuration = (mins: number) => {
    if (mins < 0) mins = 0;
    const hours = Math.floor(mins / 60);
    const minutes = Math.round(mins % 60);
    return `${hours}h ${minutes}m`;
};

export default function WeeklyProgress({ durations, weeklyTargetHours, onWeeklyTargetChange }: WeeklyProgressProps) {
  const weeklyData = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const chartData = daysOfWeek.map(day => ({
      date: day,
      day: format(day, 'EEE'),
      hours: 0,
    }));

    let totalWeeklyMinutes = 0;

    durations.forEach(duration => {
      const createdAt = new Date(duration.createdAt);
      if (isWithinInterval(createdAt, { start: weekStart, end: weekEnd })) {
        const dayIndex = chartData.findIndex(d => format(d.date, 'yyyy-MM-dd') === format(createdAt, 'yyyy-MM-dd'));
        const durationMinutes = (parseInt(duration.hours, 10) || 0) * 60 + (parseInt(duration.minutes, 10) || 0);

        if (dayIndex !== -1) {
          chartData[dayIndex].hours += durationMinutes / 60;
        }
        totalWeeklyMinutes += durationMinutes;
      }
    });
    
    // Round hours to 2 decimal places for chart
    chartData.forEach(d => {
        d.hours = Math.round(d.hours * 100) / 100;
    });

    return { chartData, totalWeeklyMinutes };
  }, [durations]);

  const { chartData, totalWeeklyMinutes } = weeklyData;

  const weeklyTargetMinutes = (parseInt(weeklyTargetHours, 10) || 0) * 60;
  const remainingWeeklyMinutes = weeklyTargetMinutes - totalWeeklyMinutes;

  const chartConfig = {
    hours: {
      label: "Hours",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Weekly Progress</CardTitle>
        <CardDescription>A summary of your logged hours for the current week.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="h-[250px] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart data={chartData} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(value) => `${value}h`}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent
                    formatter={(value, name) => [`${Number(value).toFixed(1)} hours`, '']}
                    hideLabel
                />}
              />
              <Bar dataKey="hours" fill="var(--color-hours)" radius={4} />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground">Weekly Total</p>
            <p className="text-3xl font-bold">{formatWeeklyDuration(totalWeeklyMinutes)}</p>
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground">Time Remaining (Week)</p>
            <p className="text-3xl font-bold">
              {remainingWeeklyMinutes >= 0 ? (
                formatWeeklyDuration(remainingWeeklyMinutes)
              ) : (
                <span className="text-destructive text-2xl">
                  Over by {formatWeeklyDuration(Math.abs(remainingWeeklyMinutes))}
                </span>
              )}
            </p>
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col items-center justify-center space-y-2">
            <Label htmlFor="weekly-target" className="text-sm text-muted-foreground">Weekly Target</Label>
            <Input
              id="weekly-target"
              type="number"
              value={weeklyTargetHours}
              onChange={(e) => onWeeklyTargetChange(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-24 text-center text-lg h-10"
              placeholder="40"
              min="0"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
