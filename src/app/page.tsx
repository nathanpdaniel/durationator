"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, Timer, Play, Pause, RotateCcw } from 'lucide-react';
import UserGuide from '@/components/user-guide';

type Duration = {
  id: number;
  hours: string;
  minutes: string;
};

export default function Home() {
  const [durations, setDurations] = useState<Duration[]>([
    { id: 1, hours: '', minutes: '' },
  ]);
  const [targetDuration, setTargetDuration] = useState({ hours: '', minutes: '' });
  const [nextId, setNextId] = useState(2);
  const [timerState, setTimerState] = useState<'stopped' | 'running' | 'paused'>('stopped');
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [initialCountdownSeconds, setInitialCountdownSeconds] = useState(0);

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

  const handleAddDuration = () => {
    setDurations([...durations, { id: nextId, hours: '', minutes: '' }]);
    setNextId(nextId + 1);
  };

  const handleRemoveDuration = (id: number) => {
    setDurations(durations.filter((d) => d.id !== id));
  };

  const handleDurationChange = (id: number, field: 'hours' | 'minutes', value: string) => {
    const newDurations = durations.map((d) => {
      if (d.id === id) {
        // Allow only non-negative integers
        const sanitizedValue = value.replace(/[^0-9]/g, '');
        return { ...d, [field]: sanitizedValue };
      }
      return d;
    });
    setDurations(newDurations);
  };

  const handleTargetChange = (field: 'hours' | 'minutes', value: string) => {
    const sanitizedValue = value.replace(/[^0-9]/g, '');
    setTargetDuration({ ...targetDuration, [field]: sanitizedValue });
  };

  const totalMinutes = useMemo(() => {
    return durations.reduce((acc, duration) => {
      const hours = parseInt(duration.hours, 10) || 0;
      const minutes = parseInt(duration.minutes, 10) || 0;
      return acc + (hours * 60) + minutes;
    }, 0);
  }, [durations]);

  const targetTotalMinutes = useMemo(() => {
    const hours = parseInt(targetDuration.hours, 10) || 0;
    const minutes = parseInt(targetDuration.minutes, 10) || 0;
    return (hours * 60) + minutes;
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
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
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
        hours: String(hours),
        minutes: String(minutes),
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
                <div className="grid grid-cols-2 gap-2 flex-grow">
                  <div>
                    <Label htmlFor={`hours-${duration.id}`} className="text-sm font-medium">Hours</Label>
                    <Input
                      id={`hours-${duration.id}`}
                      type="number"
                      placeholder="0"
                      value={duration.hours}
                      onChange={(e) => handleDurationChange(duration.id, 'hours', e.target.value)}
                      min="0"
                      disabled={isTimerRunning}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`minutes-${duration.id}`} className="text-sm font-medium">Minutes</Label>
                    <Input
                      id={`minutes-${duration.id}`}
                      type="number"
                      placeholder="0"
                      value={duration.minutes}
                      onChange={(e) => handleDurationChange(duration.id, 'minutes', e.target.value)}
                      min="0"
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="target-hours">Target Hours</Label>
                  <Input
                    id="target-hours"
                    type="number"
                    placeholder="e.g., 8"
                    value={targetDuration.hours}
                    onChange={(e) => handleTargetChange('hours', e.target.value)}
                    min="0"
                    disabled={isTimerRunning}
                  />
                </div>
                <div>
                  <Label htmlFor="target-minutes">Target Minutes</Label>
                  <Input
                    id="target-minutes"
                    type="number"
                    placeholder="e.g., 0"
                    value={targetDuration.minutes}
                    onChange={(e) => handleTargetChange('minutes', e.target.value)}
                    min="0"
                    disabled={isTimerRunning}
                  />
                </div>
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
        
        <div className="fixed bottom-4 right-4">
            <UserGuide />
        </div>
      </div>
    </main>
  );
}
