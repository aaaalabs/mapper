import { useRef, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { adminStyles as styles } from "../admin/styles/adminStyles";
import { Button } from "./Button";
import { Popover } from "@headlessui/react";

interface DatePickerProps {
  date?: Date;
  onChange: (date: Date) => void;
}

export function DatePicker({ date, onChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button
            ref={buttonRef}
            className={cn(
              styles.datePicker.input,
              "justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Popover.Button>

          <Popover.Panel
            className={cn(
              styles.datePicker.base,
              "absolute z-50 mt-2 p-3"
            )}
          >
            <DayPicker
              mode="single"
              selected={date}
              onSelect={(day) => {
                if (day) {
                  onChange(day);
                  setIsOpen(false);
                }
              }}
              initialFocus
              showOutsideDays
              className={styles.datePicker.calendar.base}
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  styles.button.base,
                  styles.button.ghost,
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: cn(
                  "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
                  "[&:has([aria-selected].day-outside)]:bg-accent/50",
                  "[&:has([aria-selected].day-range-end)]:rounded-r-md",
                  "[&:has([aria-selected].day-range-start)]:rounded-l-md"
                ),
                day: cn(
                  styles.datePicker.calendar.day,
                  "aria-selected:bg-primary aria-selected:text-primary-foreground"
                ),
                day_range_start: "day-range-start",
                day_range_end: "day-range-end",
                day_selected:
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside:
                  "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle:
                  "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
          </Popover.Panel>
        </>
      )}
    </Popover>
  );
}
