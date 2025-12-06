import React, { useState } from 'react';
import { Plus, Trash2, Clock, Copy } from 'lucide-react';
import { cn } from '@/app/utils/cn';

interface OperatingHour {
    day_of_week: number;
    service_type: 'dine-in' | 'pickup' | 'delivery';
    opening_time: string;
    closing_time: string;
}

interface Props {
    value: OperatingHour[];
    onChange: (hours: OperatingHour[]) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SERVICE_TYPES = ['dine-in', 'pickup', 'delivery'] as const;

export default function OperatingHoursEditor({ value = [], onChange }: Props) {
    const [selectedService, setSelectedService] = useState<'dine-in' | 'pickup' | 'delivery'>('dine-in');

    const addHour = (dayIndex: number) => {
        const newHour: OperatingHour = {
            day_of_week: dayIndex,
            service_type: selectedService,
            opening_time: '09:00',
            closing_time: '22:00'
        };
        onChange([...value, newHour]);
    };

    const removeHour = (index: number) => {
        const newValue = [...value];
        newValue.splice(index, 1);
        onChange(newValue);
    };

    const updateHour = (index: number, field: keyof OperatingHour, val: string | number) => {
        const newValue = [...value];
        newValue[index] = { ...newValue[index], [field]: val };
        onChange(newValue);
    };

    const copyToAllDays = (dayIndex: number) => {
        const dayHours = value.filter(h => h.day_of_week === dayIndex && h.service_type === selectedService);
        if (dayHours.length === 0) return;

        const newHours = value.filter(h => h.service_type !== selectedService);

        DAYS.forEach((_, idx) => {
            dayHours.forEach(h => {
                newHours.push({
                    ...h,
                    day_of_week: idx
                });
            });
        });

        onChange(newHours.sort((a, b) => a.day_of_week - b.day_of_week));
    };

    return (
        <div className="space-y-2">
            {/* Service Type Tabs - Compact */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-900/50 p-1 rounded-lg">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium ml-1">Service:</span>
                <div className="flex gap-0.5">
                    {SERVICE_TYPES.map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setSelectedService(type)}
                            className={cn(
                                "px-2 py-1 rounded text-[10px] font-medium capitalize transition-colors",
                                selectedService === type
                                    ? "bg-purple-600 text-white"
                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700"
                            )}
                        >
                            {type === 'dine-in' ? 'Dine-In' : type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Days List - Compact */}
            <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1">
                {DAYS.map((day, dayIndex) => {
                    const dayHours = value.filter(h => h.day_of_week === dayIndex && h.service_type === selectedService);

                    return (
                        <div key={dayIndex} className="flex items-center gap-2 py-1.5 px-2 bg-gray-50 dark:bg-slate-900/30 rounded-lg border border-gray-100 dark:border-white/5">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-8">{day}</span>

                            {dayHours.length === 0 ? (
                                <span className="text-[10px] text-gray-400 dark:text-gray-600 italic flex-1">Closed</span>
                            ) : (
                                <div className="flex-1 flex flex-wrap gap-1">
                                    {dayHours.map((h, i) => {
                                        const globalIndex = value.indexOf(h);
                                        return (
                                            <div key={i} className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded px-1.5 py-0.5 border border-gray-200 dark:border-white/10">
                                                <input
                                                    type="time"
                                                    value={h.opening_time.slice(0, 5)}
                                                    onChange={(e) => updateHour(globalIndex, 'opening_time', e.target.value)}
                                                    className="bg-transparent text-[10px] text-gray-700 dark:text-white w-14 outline-none"
                                                />
                                                <span className="text-gray-400 text-[10px]">-</span>
                                                <input
                                                    type="time"
                                                    value={h.closing_time.slice(0, 5)}
                                                    onChange={(e) => updateHour(globalIndex, 'closing_time', e.target.value)}
                                                    className="bg-transparent text-[10px] text-gray-700 dark:text-white w-14 outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeHour(globalIndex)}
                                                    className="text-gray-400 hover:text-red-400 p-0.5"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="flex items-center gap-0.5">
                                <button
                                    type="button"
                                    onClick={() => copyToAllDays(dayIndex)}
                                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 hover:text-purple-500"
                                    title="Copy to all"
                                >
                                    <Copy size={10} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => addHour(dayIndex)}
                                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 hover:text-green-500"
                                    title="Add hours"
                                >
                                    <Plus size={10} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
