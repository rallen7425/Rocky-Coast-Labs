import { FormField, inputClass } from './FormField'
import { Toggle } from './Toggle'

interface DateTimeRangeProps {
  date: string
  timeStart: string
  timeEnd: string
  allDay: boolean
  onDateChange: (date: string) => void
  onTimeStartChange: (time: string) => void
  onTimeEndChange: (time: string) => void
  onAllDayChange: (allDay: boolean) => void
}

/** Date + optional start/end time-of-day, with an all-day toggle that hides the time inputs. Used by events. */
export function DateTimeRange({
  date, timeStart, timeEnd, allDay,
  onDateChange, onTimeStartChange, onTimeEndChange, onAllDayChange,
}: DateTimeRangeProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <FormField label="Date" required>
          <input required type="date" value={date} onChange={e => onDateChange(e.target.value)} className={inputClass} />
        </FormField>
        <div className="pb-3">
          <Toggle checked={allDay} onChange={onAllDayChange} label="All day" />
        </div>
      </div>
      {!allDay && (
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Start Time">
            <input type="time" value={timeStart} onChange={e => onTimeStartChange(e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="End Time (optional)">
            <input type="time" value={timeEnd} onChange={e => onTimeEndChange(e.target.value)} className={inputClass} />
          </FormField>
        </div>
      )}
    </div>
  )
}
