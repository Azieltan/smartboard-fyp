'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface TimeSelectorProps {
    value: string; // Format: "HH:mm"
    onChange: (time: string) => void;
}

const ITEM_HEIGHT = 40; // Height of each item in pixels
const VISIBLE_ITEMS = 3; // How many items to show (odd number for center selection)

function ScrollColumn({ items, value, onChange, label }: {
    items: string[];
    value: number;
    onChange: (val: number) => void;
    label: string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const startY = useRef(0);
    const startScrollTop = useRef(0);

    // Scroll to the selected value on mount and when value changes
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = value * ITEM_HEIGHT;
        }
    }, [value]);

    const handleScroll = useCallback(() => {
        if (containerRef.current && !isDragging.current) {
            const scrollTop = containerRef.current.scrollTop;
            const newIndex = Math.round(scrollTop / ITEM_HEIGHT);
            if (newIndex !== value && newIndex >= 0 && newIndex < items.length) {
                onChange(newIndex);
            }
        }
    }, [value, items.length, onChange]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        if (containerRef.current) {
            const delta = e.deltaY > 0 ? 1 : -1;
            const newIndex = Math.max(0, Math.min(items.length - 1, value + delta));
            if (newIndex !== value) {
                onChange(newIndex);
                containerRef.current.scrollTop = newIndex * ITEM_HEIGHT;
            }
        }
    }, [value, items.length, onChange]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        isDragging.current = true;
        startY.current = e.clientY;
        startScrollTop.current = containerRef.current?.scrollTop || 0;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging.current && containerRef.current) {
            const deltaY = startY.current - e.clientY;
            containerRef.current.scrollTop = startScrollTop.current + deltaY;
        }
    }, []);

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        // Snap to nearest item
        if (containerRef.current) {
            const scrollTop = containerRef.current.scrollTop;
            const newIndex = Math.round(scrollTop / ITEM_HEIGHT);
            const clampedIndex = Math.max(0, Math.min(items.length - 1, newIndex));
            onChange(clampedIndex);
            containerRef.current.scrollTo({
                top: clampedIndex * ITEM_HEIGHT,
                behavior: 'smooth'
            });
        }
    }, [items.length, onChange]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        isDragging.current = true;
        startY.current = e.touches[0].clientY;
        startScrollTop.current = containerRef.current?.scrollTop || 0;
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (isDragging.current && containerRef.current) {
            const deltaY = startY.current - e.touches[0].clientY;
            containerRef.current.scrollTop = startScrollTop.current + deltaY;
        }
    }, []);

    const handleTouchEnd = useCallback(() => {
        isDragging.current = false;
        if (containerRef.current) {
            const scrollTop = containerRef.current.scrollTop;
            const newIndex = Math.round(scrollTop / ITEM_HEIGHT);
            const clampedIndex = Math.max(0, Math.min(items.length - 1, newIndex));
            onChange(clampedIndex);
            containerRef.current.scrollTo({
                top: clampedIndex * ITEM_HEIGHT,
                behavior: 'smooth'
            });
        }
    }, [items.length, onChange]);

    return (
        <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
            <div className="relative w-16" style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}>
                {/* Selection highlight */}
                <div
                    className="absolute left-0 right-0 bg-white/10 rounded-lg border border-white/20 pointer-events-none z-10"
                    style={{ top: ITEM_HEIGHT, height: ITEM_HEIGHT }}
                />
                {/* Gradient overlays for fade effect */}
                <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#1e293b] to-transparent pointer-events-none z-20" />
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#1e293b] to-transparent pointer-events-none z-20" />

                <div
                    ref={containerRef}
                    onScroll={handleScroll}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className="h-full overflow-y-auto cursor-ns-resize select-none scrollbar-hide"
                    style={{
                        scrollSnapType: 'y mandatory',
                        paddingTop: ITEM_HEIGHT,
                        paddingBottom: ITEM_HEIGHT
                    }}
                >
                    {items.map((item, index) => (
                        <div
                            key={item}
                            className={`flex items-center justify-center font-mono text-2xl font-bold transition-all duration-150 ${index === value ? 'text-white' : 'text-slate-500'
                                }`}
                            style={{
                                height: ITEM_HEIGHT,
                                scrollSnapAlign: 'center'
                            }}
                            onClick={() => {
                                onChange(index);
                                containerRef.current?.scrollTo({
                                    top: index * ITEM_HEIGHT,
                                    behavior: 'smooth'
                                });
                            }}
                        >
                            {item}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function TimeSelector({ value, onChange }: TimeSelectorProps) {
    const [hours, setHours] = useState(12);
    const [minutes, setMinutes] = useState(0);

    const hourItems = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minuteItems = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':').map(Number);
            if (!isNaN(h) && !isNaN(m)) {
                setHours(h);
                setMinutes(m);
            }
        }
    }, [value]);

    const handleHourChange = (h: number) => {
        setHours(h);
        onChange(`${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    };

    const handleMinuteChange = (m: number) => {
        setMinutes(m);
        onChange(`${hours.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    };

    return (
        <div className="flex flex-col gap-2 p-3 bg-black/20 rounded-xl border border-white/10 select-none">
            <div className="flex items-center justify-center gap-2">
                <ScrollColumn
                    items={hourItems}
                    value={hours}
                    onChange={handleHourChange}
                    label="Hour"
                />
                <div className="text-2xl font-bold text-slate-500 mt-6">:</div>
                <ScrollColumn
                    items={minuteItems}
                    value={minutes}
                    onChange={handleMinuteChange}
                    label="Minute"
                />
            </div>
            <div className="text-center text-xs text-slate-500">
                Drag up/down to adjust
            </div>
        </div>
    );
}
