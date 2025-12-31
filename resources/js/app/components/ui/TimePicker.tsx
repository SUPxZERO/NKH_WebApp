import React from 'react';

interface TimePickerProps {
    value: { hour: number; minute: number; period: 'AM' | 'PM' } | null;
    onChange: (time: { hour: number; minute: number; period: 'AM' | 'PM' }) => void;
    minHour24?: number; // Minimum hour in 24-hour format
    maxHour24?: number; // Maximum hour in 24-hour format  
    disabled?: boolean;
}

export function TimePicker({ value, onChange, minHour24 = 0, maxHour24 = 24, disabled }: TimePickerProps) {
    const [hour, setHour] = React.useState(value?.hour ?? 12);
    const [minute, setMinute] = React.useState(value?.minute ?? 0);
    const [period, setPeriod] = React.useState<'AM' | 'PM'>(value?.period ?? 'PM');

    // Sync state with value
    React.useEffect(() => {
        if (value) {
            setHour(value.hour);
            setMinute(value.minute);
            setPeriod(value.period);
        }
    }, [value]);

    const to24Hour = (h: number, p: 'AM' | 'PM') => {
        if (p === 'AM' && h === 12) return 0;
        if (p === 'PM' && h !== 12) return h + 12;
        return h;
    };

    // Calculate total minutes from midnight
    const getMinutes = (h: number, m: number, p: 'AM' | 'PM') => to24Hour(h, p) * 60 + m;

    // Constraints in minutes
    // minHour24 is basically our "start" time. If minHour24 is 14.5 (14:30), we handle it.
    // simpler: assume minHour24 is integer hours for the prop, but let's strictly use the passed numbers.
    const minTotalMinutes = minHour24 * 60;
    const maxTotalMinutes = maxHour24 * 60;

    const isTimeValid = (h: number, m: number, p: 'AM' | 'PM') => {
        const total = getMinutes(h, m, p);
        return total >= minTotalMinutes && total <= maxTotalMinutes;
    };

    const handleChange = (newHour: number, newMinute: number, newPeriod: 'AM' | 'PM') => {
        if (isTimeValid(newHour, newMinute, newPeriod)) {
            onChange({ hour: newHour, minute: newMinute, period: newPeriod });
        }
    };

    // Helper to check if ANY minute in an hour is valid
    const isHourDisabled = (h: number) => {
        // Check if there is at least one valid minute for this hour in the CURRENT period
        // But what if the period is wrong?
        // The hour dropdown should show what's valid for the CURRENT selected period.
        const startM = 0;
        const endM = 45;
        const t1 = getMinutes(h, startM, period);
        const t2 = getMinutes(h, endM, period);
        // Valid if [t1, t2] overlaps with [min, max]
        return t2 < minTotalMinutes || t1 > maxTotalMinutes;
    };

    // Helper to check if a minute is valid for current hour/period
    const isMinuteDisabled = (m: number) => {
        return !isTimeValid(hour, m, period);
    };

    // Helper to check if a period is valid (has at least one valid time)
    const isPeriodDisabled = (p: 'AM' | 'PM') => {
        // Very broad check: does this period have ANY valid time?
        // AM: 0:00 to 11:59 -> 0 to 719 minutes
        // PM: 12:00 to 23:59 -> 720 to 1439 minutes
        const pStart = p === 'AM' ? 0 : 720;
        const pEnd = p === 'AM' ? 719 : 1439;
        return pEnd < minTotalMinutes || pStart > maxTotalMinutes;
    };

    // Generate hours (1-12)
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    // Generate minutes (0, 15, 30, 45)
    const minutes = [0, 15, 30, 45];

    return (
        <div className={`${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Simple horizontal layout */}
            <div className="flex items-center justify-center gap-2">
                {/* Hour Select */}
                <div className="relative">
                    <select
                        value={hour}
                        onChange={(e) => {
                            const newHour = parseInt(e.target.value);
                            setHour(newHour);
                            handleChange(newHour, minute, period);
                        }}
                        className="appearance-none w-16 h-12 text-xl font-semibold text-center 
                       bg-gray-700/80 border border-gray-600 rounded-lg text-white
                       hover:bg-gray-600/80 focus:border-fuchsia-500 focus:outline-none
                       cursor-pointer pr-6"
                    >
                        {hours.map((h) => (
                            <option key={h} value={h} disabled={isHourDisabled(h)} className={isHourDisabled(h) ? 'text-gray-500 bg-gray-900' : 'bg-gray-800'}>
                                {h}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    </div>
                </div>

                <span className="text-2xl font-bold text-gray-400 mx-1">:</span>

                {/* Minute Select */}
                <div className="relative">
                    <select
                        value={minute}
                        onChange={(e) => {
                            const newMinute = parseInt(e.target.value);
                            setMinute(newMinute);
                            handleChange(hour, newMinute, period);
                        }}
                        className="appearance-none w-16 h-12 text-xl font-semibold text-center 
                       bg-gray-700/80 border border-gray-600 rounded-lg text-white
                       hover:bg-gray-600/80 focus:border-fuchsia-500 focus:outline-none
                       cursor-pointer pr-6"
                    >
                        {minutes.map((m) => (
                            <option key={m} value={m} disabled={isMinuteDisabled(m)} className={isMinuteDisabled(m) ? 'text-gray-500 bg-gray-900' : 'bg-gray-800'}>
                                {m.toString().padStart(2, '0')}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    </div>
                </div>

                {/* AM/PM Toggle */}
                <div className="flex rounded-lg overflow-hidden border border-gray-600 ml-2">
                    <button
                        type="button"
                        disabled={isPeriodDisabled('AM')}
                        onClick={() => {
                            setPeriod('AM');
                            handleChange(hour, minute, 'AM');
                        }}
                        className={`px-4 py-3 text-sm font-semibold transition-colors
              ${period === 'AM'
                                ? 'bg-fuchsia-500 text-white'
                                : 'bg-gray-700/80 text-gray-400 hover:bg-gray-600/80'
                            } ${isPeriodDisabled('AM') ? 'opacity-50 cursor-not-allowed hover:bg-gray-700/80' : ''}`}
                    >
                        AM
                    </button>
                    <button
                        type="button"
                        disabled={isPeriodDisabled('PM')}
                        onClick={() => {
                            setPeriod('PM');
                            handleChange(hour, minute, 'PM');
                        }}
                        className={`px-4 py-3 text-sm font-semibold transition-colors
              ${period === 'PM'
                                ? 'bg-fuchsia-500 text-white'
                                : 'bg-gray-700/80 text-gray-400 hover:bg-gray-600/80'
                            } ${isPeriodDisabled('PM') ? 'opacity-50 cursor-not-allowed hover:bg-gray-700/80' : ''}`}
                    >
                        PM
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TimePicker;
