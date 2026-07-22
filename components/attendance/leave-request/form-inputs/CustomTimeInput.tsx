import React, { useState } from 'react';
import { Clock, Edit3 } from 'lucide-react';
import TimePickerModal from '../../../ui/TimePickerModal';

interface CustomTimeInputProps {
    time: string;
    setTime: (val: string) => void;
    label?: string;
    accentColor?: 'indigo' | 'amber' | 'rose';
}

export const CustomTimeInput: React.FC<CustomTimeInputProps> = ({
    time,
    setTime,
    label = 'เวลาที่ต้องการแจ้ง',
    accentColor = 'amber'
}) => {
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

    const colorClasses = {
        indigo: {
            bg: 'bg-indigo-50/60',
            border: 'border-indigo-200',
            hoverBorder: 'hover:border-indigo-400',
            text: 'text-indigo-700',
            placeholder: 'text-indigo-300',
            icon: 'text-indigo-500',
            badgeBg: 'bg-indigo-100/70',
            badgeText: 'text-indigo-800'
        },
        amber: {
            bg: 'bg-amber-50/60',
            border: 'border-amber-200',
            hoverBorder: 'hover:border-amber-400',
            text: 'text-amber-700',
            placeholder: 'text-amber-300',
            icon: 'text-amber-500',
            badgeBg: 'bg-amber-100/70',
            badgeText: 'text-amber-800'
        },
        rose: {
            bg: 'bg-rose-50/60',
            border: 'border-rose-200',
            hoverBorder: 'hover:border-rose-400',
            text: 'text-rose-700',
            placeholder: 'text-rose-300',
            icon: 'text-rose-500',
            badgeBg: 'bg-rose-100/70',
            badgeText: 'text-rose-800'
        }
    };

    const styles = colorClasses[accentColor];

    return (
        <div className="space-y-2 mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between ml-1">
                <label className="text-[12px] font-kanit font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Edit3 className={`w-3.5 h-3.5 ${styles.icon}`} />
                    {label}
                </label>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${styles.badgeBg} ${styles.badgeText}`}>
                    ระบุเวลาเอง
                </span>
            </div>

            <button
                type="button"
                onClick={() => setIsTimePickerOpen(true)}
                className={`w-full p-4 ${styles.bg} border ${styles.border} rounded-2xl text-left transition-all ${styles.hoverBorder} hover:shadow-md hover:bg-white flex items-center justify-between group`}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                        <Clock className={`w-5 h-5 ${styles.icon}`} />
                    </div>
                    <div>
                        <span className="text-[11px] text-slate-400 block font-sarabun font-medium">เวลาเข้างาน</span>
                        <span className={`text-2xl font-semibold font-mono tracking-tight ${time ? styles.text : styles.placeholder}`}>
                            {time || '--:--'}
                        </span>
                    </div>
                </div>

                <span className="text-xs font-medium text-slate-400 group-hover:text-slate-600 px-3 py-1.5 bg-white rounded-lg border border-slate-200/80 shadow-xs">
                    เลือกเวลา
                </span>
            </button>

            <TimePickerModal
                isOpen={isTimePickerOpen}
                onClose={() => setIsTimePickerOpen(false)}
                initialTime={time}
                onSelect={(val) => setTime(val)}
            />
        </div>
    );
};

export default CustomTimeInput;
