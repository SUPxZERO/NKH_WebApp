import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Skeleton } from '@/app/components/ui/Loading';
import { Calendar, Clock, User } from 'lucide-react';

interface Employee {
  id: number;
  name: string;
  role: string;
  avatar?: string;
}

interface Shift {
  id: number;
  employee_id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'completed';
}

interface Props {
  employees: Employee[];
  shifts: Shift[];
  onScheduleShift: (employeeId: number, date: string, startTime: string, endTime: string) => void;
  isLoading?: boolean;
}

export default function EmployeeScheduler({ employees, shifts, onScheduleShift, isLoading }: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  const handleSchedule = () => {
    if (selectedEmployee && selectedDate) {
      onScheduleShift(selectedEmployee, selectedDate, startTime, endTime);
      setSelectedEmployee(null);
    }
  };

  const getShiftsForDate = (date: string) => {
    return shifts.filter(shift => shift.date === date);
  };

  const getEmployeeShift = (employeeId: number, date: string) => {
    return shifts.find(shift => shift.employee_id === employeeId && shift.date === date);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <h3 className="font-semibold">Employee Scheduler</h3>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border border-white/10 rounded-lg px-3 py-1 text-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Schedule Form */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select
                  value={selectedEmployee || ''}
                  onChange={(e) => setSelectedEmployee(Number(e.target.value) || null)}
                  className="bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm"
                />
                <Button onClick={handleSchedule} disabled={!selectedEmployee}>
                  Schedule
                </Button>
              </div>
            </div>

            {/* Employee List with Shifts */}
            <div className="space-y-2">
              {employees.map(employee => {
                const shift = getEmployeeShift(employee.id, selectedDate);
                return (
                  <div key={employee.id} className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                        {employee.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-xs text-gray-500">{employee.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {shift ? (
                        <div>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="w-3 h-3" />
                            {shift.start_time} - {shift.end_time}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                            shift.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                            shift.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-orange-500/20 text-orange-400'
                          }`}>
                            {shift.status}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">Not scheduled</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
