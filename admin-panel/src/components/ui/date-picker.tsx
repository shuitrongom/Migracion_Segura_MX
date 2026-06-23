'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  yearRange?: [number, number];
  disablePast?: boolean;
  disableWeekends?: boolean;
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

export function DatePicker({ value, onChange, placeholder = 'dd/mm/aaaa', className = '', yearRange, disablePast = false, disableWeekends = false }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'days' | 'months' | 'years'>('days');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [yearPageStart, setYearPageStart] = useState(Math.floor(new Date().getFullYear() / 20) * 20);
  const containerRef = useRef<HTMLDivElement>(null);

  const minYear = yearRange?.[0] ?? 1940;
  const maxYear = yearRange?.[1] ?? 2040;

  // Parse value
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setCurrentMonth(d.getMonth());
        setCurrentYear(d.getFullYear());
      }
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setView('days');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday = 0
  };

  const handleSelectDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(dateStr);
    setIsOpen(false);
    setView('days');
  };

  const handleSelectMonth = (month: number) => {
    setCurrentMonth(month);
    setView('days');
  };

  const handleSelectYear = (year: number) => {
    setCurrentYear(year);
    setView('months');
  };

  const formatDisplay = (val: string) => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const selectedDate = value ? new Date(value) : null;

  const renderDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div className="grid grid-cols-7 gap-1">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-white/70 py-1">{d}</div>
        ))}
        {days.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth && selectedDate.getFullYear() === currentYear;
          const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;
          const dateObj = new Date(currentYear, currentMonth, day);
          const dayOfWeek = dateObj.getDay(); // 0=Sun, 6=Sat
          const isPast = disablePast && dateObj < new Date(new Date().setHours(0,0,0,0));
          const isWeekend = disableWeekends && (dayOfWeek === 0 || dayOfWeek === 6);
          const isDisabled = isPast || isWeekend;
          return (
            <button
              key={day}
              type="button"
              onClick={() => !isDisabled && handleSelectDay(day)}
              disabled={isDisabled}
              className={`h-8 w-8 rounded-full text-xs font-medium transition-all ${
                isDisabled
                  ? 'text-white/70 cursor-not-allowed'
                  : isSelected
                    ? 'bg-amber-500 text-white shadow-sm'
                    : isToday
                      ? 'bg-amber-500/10 text-amber-400 ring-1 ring-brand-300'
                      : 'text-white/70 hover:bg-[#222222]'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    );
  };

  const renderMonths = () => (
    <div className="grid grid-cols-3 gap-2 p-2">
      {MESES.map((mes, i) => {
        const isSelected = currentMonth === i;
        return (
          <button
            key={mes}
            type="button"
            onClick={() => handleSelectMonth(i)}
            className={`px-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
              isSelected ? 'bg-amber-500 text-white' : 'text-white/70 hover:bg-[#222222]'
            }`}
          >
            {mes.slice(0, 3)}
          </button>
        );
      })}
    </div>
  );

  const renderYears = () => {
    const years: number[] = [];
    for (let y = yearPageStart; y < yearPageStart + 20 && y <= maxYear; y++) {
      if (y >= minYear) years.push(y);
    }
    return (
      <div>
        <div className="flex items-center justify-between px-2 mb-2">
          <button type="button" onClick={() => setYearPageStart(Math.max(minYear, yearPageStart - 20))} disabled={yearPageStart <= minYear} className="p-1 rounded hover:bg-[#222222] disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-xs font-medium text-white/70">{yearPageStart} — {Math.min(yearPageStart + 19, maxYear)}</span>
          <button type="button" onClick={() => setYearPageStart(Math.min(maxYear - 19, yearPageStart + 20))} disabled={yearPageStart + 20 > maxYear} className="p-1 rounded hover:bg-[#222222] disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-4 gap-2 p-2">
          {years.map(y => {
            const isSelected = currentYear === y;
            return (
              <button
                key={y}
                type="button"
                onClick={() => handleSelectYear(y)}
                className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                  isSelected ? 'bg-amber-500 text-white' : 'text-white/70 hover:bg-[#222222]'
                }`}
              >
                {y}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between px-3 py-2 border border-[#3a3a3a] rounded-lg text-sm cursor-pointer hover:border-[#333333] transition-colors ${className} ${isOpen ? 'ring-2 ring-amber-500 border-transparent' : ''}`}
      >
        <span className={value ? 'text-white' : 'text-white/70'}>{value ? formatDisplay(value) : placeholder}</span>
        <Calendar className="h-4 w-4 text-white/70" />
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[9999]" onClick={() => { setIsOpen(false); setView('days'); }}>
          <div
            className="absolute bg-[#171717] border border-[#3a3a3a] rounded-xl shadow-2xl p-4 w-[300px] animate-in fade-in slide-in-from-top-2 duration-200"
            style={{ top: containerRef.current ? containerRef.current.getBoundingClientRect().bottom + 4 : 0, left: containerRef.current ? Math.min(containerRef.current.getBoundingClientRect().left, window.innerWidth - 310) : 0 }}
            onClick={(e) => e.stopPropagation()}
          >
          {/* Header */}
          {view === 'days' && (
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); }} className="p-1.5 rounded-lg hover:bg-[#222222] transition-colors"><ChevronLeft className="h-4 w-4 text-white/70" /></button>
              <button type="button" onClick={() => setView('months')} className="text-sm font-semibold text-white hover:text-amber-500 transition-colors px-2 py-1 rounded-lg hover:bg-[#1a1a1a]">
                {MESES[currentMonth]} <span className="text-amber-500 cursor-pointer" onClick={(e) => { e.stopPropagation(); setView('years'); setYearPageStart(Math.floor(currentYear / 20) * 20); }}>{currentYear}</span>
              </button>
              <button type="button" onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); }} className="p-1.5 rounded-lg hover:bg-[#222222] transition-colors"><ChevronRight className="h-4 w-4 text-white/70" /></button>
            </div>
          )}

          {view === 'months' && (
            <div className="flex items-center justify-between mb-3 px-2">
              <button type="button" onClick={() => setCurrentYear(y => y - 1)} className="p-1.5 rounded-lg hover:bg-[#222222]"><ChevronLeft className="h-4 w-4 text-white/70" /></button>
              <button type="button" onClick={() => { setView('years'); setYearPageStart(Math.floor(currentYear / 20) * 20); }} className="text-sm font-semibold text-white hover:text-amber-500 px-2 py-1 rounded-lg hover:bg-[#1a1a1a]">{currentYear}</button>
              <button type="button" onClick={() => setCurrentYear(y => y + 1)} className="p-1.5 rounded-lg hover:bg-[#222222]"><ChevronRight className="h-4 w-4 text-white/70" /></button>
            </div>
          )}

          {view === 'years' && (
            <div className="mb-2">
              <p className="text-xs font-medium text-white/70 text-center mb-1">Selecciona el año</p>
            </div>
          )}

          {/* Content */}
          {view === 'days' && renderDays()}
          {view === 'months' && renderMonths()}
          {view === 'years' && renderYears()}

          {/* Footer */}
          {view === 'days' && (
            <div className="mt-3 pt-2 border-t flex justify-between">
              <button type="button" onClick={() => { const today = new Date(); onChange(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`); setIsOpen(false); }} className="text-xs text-amber-500 font-medium hover:text-amber-400">Hoy</button>
              <button type="button" onClick={() => { onChange(''); setIsOpen(false); }} className="text-xs text-white/70 hover:text-white/70">Limpiar</button>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
