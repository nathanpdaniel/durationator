"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, Timer, Play, Pause, RotateCcw, CalendarIcon } from 'lucide-react';
import UserGuide from '@/components/user-guide';
import WeeklyProgress from '@/components/weekly-progress';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type Duration = {
  id: number;
  entry: string;
  createdAt: Date;
};

// This is for WeeklyProgress component that expects hours and minutes
type DurationForWeeklyProgress = {
  id: number;
  hours: string;
  minutes: string;
  createdAt: Date;
};

export default function Home() {
  const [durations, setDurations] = useState<Duration[]>([
    { id: 1, entry: '', createdAt: new Date() },
  ]);
  const [targetDuration, setTargetDuration] = useState('');
  const [nextId, setNextId] = useState(2);
  const [timerState, setTimerState] = useState<'stopped' | 'running' | 'paused'>('stopped');
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [initialCountdownSeconds, setInitialCountdownSeconds] = useState(0);
  const [weeklyTargetHours, setWeeklyTargetHours] = useState('40');

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (timerState === 'running' && countdownSeconds > 0) {
      interval = setInterval(() => {
        setCountdownSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerState === 'running' && countdownSeconds === 0) {
      setTimerState('stopped');
    }
    return () => clearInterval(interval);
  }, [timerState, countdownSeconds]);

  const parseDurationToMinutes = (entry: string): number => {
    if (!entry) return 0;

    const s = entry.trim().toLowerCase();

    // Format: 7:30
    const timeMatch = s.match(/^(\d+):(\d+)$/);
    if (timeMatch) {
      return (parseInt(timeMatch[1], 10) || 0) * 60 + (parseInt(timeMatch[2], 10) || 0);
    }

    let totalMinutes = 0;

    // Regex to find hours and minutes components
    const hourRegex = /(\d+(?:\.\d+)?)\s*h/;
    const minuteRegex = /(\d+)\s*m/;
    
    const hourMatch = s.match(hourRegex);
    if (hourMatch) {
      totalMinutes += parseFloat(hourMatch[1]) * 60;
    }

    const minuteMatch = s.match(minuteRegex);
    if (minuteMatch) {
      totalMinutes += parseInt(minuteMatch[1], 10);
    }
    
    // Handle '7h30' or '7h 30' where minutes are not explicitly marked with 'm'
    if (hourMatch && !minuteMatch) {
      const rest = s.replace(hourRegex, '').trim();
      if (rest.length > 0 && /^\d+$/.test(rest)) {
        totalMinutes += parseInt(rest, 10);
      }
    }
    
    if (hourMatch || minuteMatch) {
      return Math.round(totalMinutes);
    }

    return 0;
  };

  const handleAddDuration = () => {
    setDurations([...durations, { id: nextId, entry: '', createdAt: new Date() }]);
    setNextId(nextId + 1);
  };

  const handleRemoveDuration = (id: number) => {
    setDurations(durations.filter((d) => d.id !== id));
  };

  const handleDurationChange = (id: number, value: string) => {
    const newDurations = durations.map((d) => {
      if (d.id === id) {
        return { ...d, entry: value };
      }
      return d;
    });
    setDurations(newDurations);
  };

  const handleDateChange = (id: number, date: Date | undefined) => {
    if (!date) return;
    setDurations(
      durations.map((d) => (d.id === id ? { ...d, createdAt: date } : d))
    );
  };

  const handleTargetChange = (value: string) => {
    setTargetDuration(value);
  };

  const totalMinutes = useMemo(() => {
    return durations.reduce((acc, duration) => {
      return acc + parseDurationToMinutes(duration.entry);
    }, 0);
  }, [durations]);

  const targetTotalMinutes = useMemo(() => {
    return parseDurationToMinutes(targetDuration);
  }, [targetDuration]);

  const remainingMinutes = useMemo(() => {
    if (targetTotalMinutes <= 0) return 0;
    return targetTotalMinutes - totalMinutes;
  }, [targetTotalMinutes, totalMinutes]);

  const displayedTotalMinutes = useMemo(() => {
    if (timerState !== 'stopped') {
      const elapsedSeconds = initialCountdownSeconds - countdownSeconds;
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      return totalMinutes + elapsedMinutes;
    }
    return totalMinutes;
  }, [timerState, totalMinutes, initialCountdownSeconds, countdownSeconds]);

  const formatDuration = (mins: number) => {
    if (mins < 0) mins = 0;
    const hours = Math.floor(mins / 60);
    const minutes = Math.round(mins % 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDurationWithSeconds = (totalSeconds: number) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleStart = () => {
    if (remainingMinutes > 0) {
      const startSeconds = remainingMinutes * 60;
      setInitialCountdownSeconds(startSeconds);
      setCountdownSeconds(startSeconds);
      setTimerState('running');
    }
  };

  const handlePause = () => {
    const elapsedSeconds = initialCountdownSeconds - countdownSeconds;
    const elapsedWholeMinutes = Math.floor(elapsedSeconds / 60);

    if (elapsedWholeMinutes > 0) {
      const hours = Math.floor(elapsedWholeMinutes / 60);
      const minutes = elapsedWholeMinutes % 60;
      
      const newDuration = {
        id: nextId,
        entry: minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`,
        createdAt: new Date(),
      };

      setDurations([...durations, newDuration]);
      setNextId(nextId + 1);

      // Reset the timer's accrual baseline, but keep the leftover seconds
      const remainingTimerSeconds = elapsedSeconds % 60;
      setInitialCountdownSeconds(countdownSeconds + remainingTimerSeconds);
    }
    
    setTimerState('paused');
  };
  
  const handleResume = () => {
    setTimerState('running');
  };

  const handleReset = () => {
    setTimerState('stopped');
    setCountdownSeconds(0);
    setInitialCountdownSeconds(0);
  }

  const isTimerRunning = timerState === 'running';

  const durationsForWeeklyProgress: DurationForWeeklyProgress[] = useMemo(() => {
    return durations.map(d => {
        const totalMins = parseDurationToMinutes(d.entry);
        const hours = String(Math.floor(totalMins / 60));
        const minutes = String(totalMins % 60);
        return { id: d.id, createdAt: d.createdAt, hours, minutes };
    })
  }, [durations]);

  return (
    <main className="flex min-h-screen w-full items-start justify-center p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-2xl space-y-8 mt-8">
        <header className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Timer className="w-10 h-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground">
              Durationator
            </h1>
          </div>
          <p className="text-muted-foreground">
            Sum up your time entries and track your progress towards a goal.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Duration Entries</CardTitle>
            <CardDescription>
              Add or remove duration entries. The total will be calculated automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {durations.map((duration) => (
              <div key={duration.id} className="flex items-center gap-2 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-grow">
                  <div className='sm:col-span-1'>
                    <Label htmlFor={`date-${duration.id}`} className="text-sm font-medium">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !duration.createdAt && "text-muted-foreground"
                          )}
                          disabled={isTimerRunning}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {duration.createdAt ? format(duration.createdAt, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={duration.createdAt}
                          onSelect={(date) => handleDateChange(duration.id, date)}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className='sm:col-span-2'>
                    <Label htmlFor={`duration-entry-${duration.id}`} className="text-sm font-medium">Duration</Label>
                    <Input
                      id={`duration-entry-${duration.id}`}
                      type="text"
                      placeholder="e.g., 2h 30m or 2:30"
                      value={duration.entry}
                      onChange={(e) => handleDurationChange(duration.id, e.target.value)}
                      disabled={isTimerRunning}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveDuration(duration.id)}
                  className="self-end text-muted-foreground hover:text-destructive"
                  aria-label="Remove duration"
                  disabled={durations.length <= 1 || isTimerRunning}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={handleAddDuration} disabled={isTimerRunning}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Duration
            </Button>
          </CardFooter>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="flex flex-col text-center">
            <CardHeader>
              <CardTitle>Total Duration</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
              <div className="text-5xl font-bold text-primary transition-all duration-300">
                {formatDuration(displayedTotalMinutes)}
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Target &amp; Remaining</CardTitle>
              <CardDescription>Set a target to see remaining time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="target-duration">Target Duration</Label>
                <Input
                  id="target-duration"
                  type="text"
                  placeholder="e.g., 8h or 8:00"
                  value={targetDuration}
                  onChange={(e) => handleTargetChange(e.target.value)}
                  disabled={isTimerRunning}
                />
              </div>
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">Time Remaining</p>
                <div className="text-3xl font-bold transition-all duration-300 min-h-[36px]">
                  {timerState !== 'stopped' ? (
                    <span className="text-primary">{formatDurationWithSeconds(countdownSeconds)}</span>
                  ) : targetTotalMinutes > 0 ? (
                    remainingMinutes >= 0 ? (
                      <span className="text-primary">{formatDuration(remainingMinutes)}</span>
                    ) : (
                      <span className="text-destructive text-2xl">
                        Exceeded by {formatDuration(Math.abs(remainingMinutes))}
                      </span>
                    )
                  ) : (
                    <span className="text-muted-foreground">--h --m</span>
                  )}
                </div>
                {timerState !== 'stopped' && (
                  <div className="text-xs text-muted-foreground mt-1">
                    <p>
                      Accrued from timer: {formatDuration(Math.floor((initialCountdownSeconds - countdownSeconds) / 60))}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-2">
              {timerState === 'stopped' && (
                  <Button onClick={handleStart} disabled={remainingMinutes <= 0}>
                      <Play className="mr-2 h-4 w-4" /> Start Timer
                  </Button>
              )}
              {timerState === 'running' && (
                  <Button onClick={handlePause}>
                      <Pause className="mr-2 h-4 w-4" /> Pause Timer
                  </Button>
              )}
              {timerState === 'paused' && (
                  <div className="grid grid-cols-2 gap-2">
                      <Button onClick={handleResume}>
                          <Play className="mr-2 h-4 w-4" /> Resume
                      </Button>
                      <Button variant="outline" onClick={handleReset}>
                          <RotateCcw className="mr-2 h-4 w-4" /> Reset
                      </Button>
                  </div>
              )}
            </CardFooter>
          </Card>
        </div>
        
        <WeeklyProgress
          durations={durationsForWeeklyProgress}
          weeklyTargetHours={weeklyTargetHours}
          onWeeklyTargetChange={setWeeklyTargetHours}
        />

        <div className="fixed bottom-4 right-4">
            <UserGuide />
        </div>
      </div>
    </main>
  );
}
