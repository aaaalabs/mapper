import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from '@heroicons/react/24/outline';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { adminStyles as styles } from '../admin/styles/adminStyles';
import { Button } from './Button';

interface DatePickerProps {
  date?: Date;
  onChange?: (date?: Date) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function DatePicker({
  date,
  onChange,
  disabled,
  placeholder = 'Pick a date'
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        className={cn(
          styles.datePicker.base,
          !date && "text-muted-foreground"
        )}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? format(date, 'PPP') : placeholder}
      </Button>
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-50">
          <div className={styles.datePicker.calendar.base}>
            <DayPicker
              mode="single"
              selected={date}
              onSelect={(day) => {
                onChange?.(day);
                setIsOpen(false);
              }}
              disabled={disabled}
              classNames={{
                months: styles.datePicker.calendar.wrapper,
                head: styles.datePicker.calendar.head,
                head_cell: styles.datePicker.calendar.weekNumber,
                nav: styles.datePicker.calendar.header,
                nav_button: styles.datePicker.navigationButton,
                table: styles.datePicker.calendar.grid,
                cell: styles.datePicker.calendar.cell,
                day: styles.datePicker.calendar.day,
                day_selected: styles.datePicker.calendar.selected,
                day_today: styles.datePicker.calendar.today,
                day_outside: styles.datePicker.calendar.adjacent,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
