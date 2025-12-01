import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
    startDate: Date | undefined;
    endDate: Date | undefined;
    onStartDateChange: (date: Date | null) => void;
    onEndDateChange: (date: Date | null) => void;
    className?: string;
}

export default function DateRangePicker({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    className = ''
}: DateRangePickerProps) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                <DatePicker
                    selected={startDate}
                    onChange={onStartDateChange}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="Start Date"
                    className="bg-white/5 border border-white/10 rounded-lg px-10 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-40"
                    dateFormat="MMM d, yyyy"
                    maxDate={new Date()}
                />
            </div>

            <span className="text-gray-400 text-sm">to</span>

            <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                <DatePicker
                    selected={endDate}
                    onChange={onEndDateChange}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    placeholderText="End Date"
                    className="bg-white/5 border border-white/10 rounded-lg px-10 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-40"
                    dateFormat="MMM d, yyyy"
                    maxDate={new Date()}
                />
            </div>
        </div>
    );
}
