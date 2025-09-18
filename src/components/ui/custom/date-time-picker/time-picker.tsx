"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { TimePickerInput } from "./time-picker-input";
import { useTranslation } from "react-i18next";

interface TimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  granularity?: "hour" | "minute" | "second";
}

export function TimePicker({
  date,
  setDate,
  granularity = "minute"
}: TimePickerProps) {
  const { t } = useTranslation();
  const minuteRef = React.useRef<HTMLInputElement>(null);
  const hourRef = React.useRef<HTMLInputElement>(null);
  const secondRef = React.useRef<HTMLInputElement>(null);

  const showSeconds = granularity === "second";

  return (
    <div className="flex items-end gap-2">
      <div className="grid gap-1 text-center">
        <Label htmlFor="hours" className="text-xs">
          {t('common.time.hours')}
        </Label>
        <TimePickerInput
          picker="hours"
          date={date}
          setDate={setDate}
          ref={hourRef}
          onRightFocus={() => minuteRef.current?.focus()}
        />
      </div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="minutes" className="text-xs">
          {t('common.time.minutes')}
        </Label>
        <TimePickerInput
          picker="minutes"
          date={date}
          setDate={setDate}
          ref={minuteRef}
          onLeftFocus={() => hourRef.current?.focus()}
          onRightFocus={() => showSeconds ? secondRef.current?.focus() : undefined}
        />
      </div>
      {showSeconds && (
        <div className="grid gap-1 text-center">
          <Label htmlFor="seconds" className="text-xs">
            {t('common.time.seconds')}
          </Label>
          <TimePickerInput
            picker="seconds"
            date={date}
            setDate={setDate}
            ref={secondRef}
            onLeftFocus={() => minuteRef.current?.focus()}
          />
        </div>
      )}
      <div className="flex h-10 items-center">
        <Clock className="ml-2 h-4 w-4" />
      </div>
    </div>
  );
}