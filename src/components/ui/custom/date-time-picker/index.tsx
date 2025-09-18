"use client";

import * as React from "react";
import { add, format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Locale } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TimePicker } from "./time-picker";

interface DateTimePickerSimpleProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  granularity?: "hour" | "minute" | "second";
  locale?: Locale;
  disabled?: boolean;
  className?: string;
}

export function DateTimePickerSimple({
  value,
  onChange,
  placeholder,
  granularity = "minute",
  locale,
  disabled = false,
  className
}: DateTimePickerSimpleProps) {
  const { t } = useTranslation();
  const [date, setDate] = React.useState<Date | undefined>(value);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setDate(value);
  }, [value]);

  /**
   * carry over the current time when a user clicks a new day
   * instead of resetting to 00:00
   */
  const handleSelect = (newDay: Date | undefined) => {
    if (!newDay) return;

    if (!date) {
      setDate(newDay);
      onChange?.(newDay);
      return;
    }

    // Preserve the time from the current date
    newDay.setHours(date.getHours());
    newDay.setMinutes(date.getMinutes());
    newDay.setSeconds(date.getSeconds());

    setDate(newDay);
    onChange?.(newDay);
  };

  const handleTimeChange = (newTime: Date | undefined) => {
    setDate(newTime);
    onChange?.(newTime);
  };

  const formatString = React.useMemo(() => {
    if (granularity === "second") return "PPP HH:mm:ss";
    if (granularity === "hour") return "PPP HH:00";
    return "PPP HH:mm";
  }, [granularity]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, formatString, { locale })
          ) : (
            <span>{placeholder || t('common.pickDate')}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          locale={locale}
        />
        <div className="p-3 border-t border-border">
          <TimePicker
            setDate={handleTimeChange}
            date={date}
            granularity={granularity}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}