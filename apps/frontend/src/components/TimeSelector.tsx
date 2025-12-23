'use client';

import { useState, useEffect, useRef } from 'react';

interface TimeSelectorProps {
    value: string; // Format: "HH:mm"
    onChange: (time: string) => void;
}

export default function TimeSelector({ value, onChange }: TimeSelectorProps) {
    const [hours, setHours] = useState(12);
    const [minutes, setMinutes] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':').map(Number);
            if (!isNaN(h) && !isNaN(m)) {
                setHours(h);
                setMinutes(m);
            }
        }
    }, [value]);

    const handleTimeChange = (h: number, m: number) => {
        const newH = Math.max(0, Math.min(23, h));
        const newM = Math.max(0, Math.min(59, m));
        setHours(newH);
        setMinutes(newM);
        onChange(`${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`);
    };

    return (
        <div className="flex flex-col gap-4 p-4 bg-white/5 rounded-xl border border-white/10 select-none">
            <label className="text-sm font-semibold text-slate-300">Select Time</label>

            <div className="flex items-center justify-center gap-4">
                {/* Hours */}
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Hour</span>
                    <div className="relative w-16 h-32 bg-black/20 rounded-lg overflow-hidden flex items-center justify-center">
                        <input
                            type="range"
                            min="0"
                            max="23"
                            value={hours}
                            onChange={(e) => handleTimeChange(parseInt(e.target.value), minutes)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize z-10"
                            style={{ appearance: 'slider-vertical' } as any}
                        />
                        <div className="text-3xl font-bold text-white font-mono z-0 pointer-events-none">
                            {hours.toString().padStart(2, '0')}
                        </div>
                    </div>
                </div>

                <div className="text-2xl font-bold text-slate-500 mb-6">:</div>

                {/* Minutes */}
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Minute</span>
                    <div className="relative w-16 h-32 bg-black/20 rounded-lg overflow-hidden flex items-center justify-center">
                        <input
                            type="range"
                            min="0"
                            max="59"
                            value={minutes}
                            onChange={(e) => handleTimeChange(hours, parseInt(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize z-10"
                            style={{ appearance: 'slider-vertical' } as any}
                        />
                        <div className="text-3xl font-bold text-white font-mono z-0 pointer-events-none">
                            {minutes.toString().padStart(2, '0')}
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center text-xs text-slate-500">
                Drag up/down to adjust
            </div>
        </div>
    );
}
