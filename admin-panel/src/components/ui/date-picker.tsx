'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

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

export function DatePicker({ value, onChange, placeholder = 'Seleccionar fecha', className = '', yearRange, disablePast = false, disableWeekends = false }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'days' | 'months' | 'years'>('days');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [yearPageStart, setYearPageStart] = useState(Math.floor(new Date().getFullYear() / 20) * 20);
  const containerRef = useRef<HTMLDivElement>(null);

  const minYear = yearRange?.[0] ?? 1940;
  const maxYear = yearRange?.[1] ?? 2040;

  useEffect(() => {
    if (value) {
      const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (parts) {
        setCurrentYear(parseInt(parts[1]));
        setCurrentMonth(parseInt(parts[2]) - 1);
      }
    }
  }, [value]);

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
    return day === 0 ? 6 : day - 1;
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
    const parts = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (parts) {
      const monthName = MESES[parseInt(parts[2]) - 1]?.slice(0, 3);
      return `${parseInt(parts[3])} ${monthName} ${parts[1]}`;
    }
    return val;
  };

  const selectedDate = value ? (() => {
    const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (parts) return { year: parseInt(parts[1]), month: parseInt(parts[2]) - 1, day: parseInt(parts[3]) };
    return null;
  })() : null;

  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  const renderDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div className="grid grid-cols-7 gap-0.5">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-white/40 py-2 uppercase tracking-wider">{d}</div>
        ))}
        {days.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="h-9" />;
          const isSelected = selectedDate && selectedDate.day === day && selectedDate.month === currentMonth && selectedDate.year === currentYear;
          const isToday = todayDay === day && todayMonth === currentMonth && todayYear === currentYear;
          const dateObj = new Date(currentYear, currentMonth, day);
          const dayOfWeek = dateObj.getDay();
          const isPast = disablePast && dateObj < new Date(new Date().setHours(0,0,0,0));
          const isWeekend = disableWeekends && (dayOfWeek === 0 || dayOfWeek === 6);
          const isDisabled = isPast || isWeekend;
          return (
            <button
              key={day}
              type="button"
              onClick={() => !isDisabled && handleSelectDay(day)}
              disabled={isDisabled}
              className={`h-9 w-full rounded-lg text-xs font-medium transition-all duration-150 ${
                isDisabled
                  ? 'text-white/20 cursor-not-allowed'
                  : isSelected
                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 scale-105'
                    : isToday
                      ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/40 font-bold'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
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
    <div className="grid grid-cols-3 gap-2 p-1">
      {MESES.map((mes, i) => {
        const isSelected = currentMonth === i;
        const isCurrent = todayMonth === i && currentYear === todayYear;
        return (
          <button
            key={mes}
            type="button"
            onClick={() => handleSelectMonth(i)}
            className={`px-2 py-3 rounded-xl text-xs font-medium transition-all duration-150 ${
              isSelected
                ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30'
                : isCurrent
                  ? 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
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
        <div className="flex items-center justify-between px-2 mb-3">
          <button type="button" onClick={() => setYearPageStart(Math.max(minYear, yearPageStart - 20))} disabled={yearPageStart <= minYear} className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"><ChevronLeft className="h-4 w-4 text-white/70" /></button>
          <span className="text-xs font-semibold text-white/60">{yearPageStart} — {Math.min(yearPageStart + 19, maxYear)}</span>
          <button type="button" onClick={() => setYearPageStart(Math.min(maxYear - 19, yearPageStart + 20))} disabled={yearPageStart + 20 > maxYear} className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"><ChevronRight className="h-4 w-4 text-white/70" /></button>
        </div>
        <div className="grid grid-cols-4 gap-2 p-1">
          {years.map(y => {
            const isSelected = currentYear === y;
            const isCurrent = todayYear === y;
            return (
              <button
                key={y}
                type="button"
                onClick={() => handleSelectYear(y)}
                className={`px-2 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                  isSelected
                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30'
                    : isCurrent
                      ? 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
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
        className={`flex items-center justify-between px-3 py-2.5 bg-[#252525] border border-[#3a3a3a] rounded-lg text-sm cursor-pointer hover:border-amber-500/40 transition-all duration-200 ${className} ${isOpen ? 'ring-2 ring-amber-500/50 border-amber-500/50 shadow-lg shadow-amber-500/10' : ''}`}
      >
        <span className={value ? 'text-white font-medium' : 'text-white/50'}>{value ? formatDisplay(value) : placeholder}</span>
        <Calendar className={`h-4 w-4 transition-colors ${isOpen ? 'text-amber-500' : 'text-white/50'}`} />
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[9999]" onClick={() => { setIsOpen(false); setView('days'); }}>
          <div
            className="absolute bg-[#1a1a1a] border border-[#333] rounded-2xl shadow-2xl shadow-black/60 p-5 w-[320px] animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-xl"
            style={{ top: containerRef.current ? containerRef.current.getBoundingClientRect().bottom + 8 : 0, left: containerRef.current ? Math.min(containerRef.current.getBoundingClientRect().left, window.innerWidth - 330) : 0 }}
            onClick={(e) => e.stopPropagation()}
          >
          {/* Header */}
          {view === 'days' && (
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); }} className="p-2 rounded-xl hover:bg-white/10 transition-colors"><ChevronLeft className="h-4 w-4 text-white/70" /></button>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setView('months')} className="text-sm font-bold text-white hover:text-amber-400 transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
                  {MESES[currentMonth]}
                </button>
                <button type="button" onClick={() => { setView('years'); setYearPageStart(Math.floor(currentYear / 20) * 20); }} className="text-sm font-bold text-amber-500 hover:text-amber-400 transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
                  {currentYear}
                </button>
              </div>
              <button type="button" onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); }} className="p-2 rounded-xl hover:bg-white/10 transition-colors"><ChevronRight className="h-4 w-4 text-white/70" /></button>
            </div>
          )}

          {view === 'months' && (
            <div className="flex items-center justify-between mb-4 px-1">
              <button type="button" onClick={() => setCurrentYear(y => y - 1)} className="p-2 rounded-xl hover:bg-white/10 transition-colors"><ChevronLeft className="h-4 w-4 text-white/70" /></button>
              <button type="button" onClick={() => { setView('years'); setYearPageStart(Math.floor(currentYear / 20) * 20); }} className="text-sm font-bold text-amber-500 hover:text-amber-400 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">{currentYear}</button>
              <button type="button" onClick={() => setCurrentYear(y => y + 1)} className="p-2 rounded-xl hover:bg-white/10 transition-colors"><ChevronRight className="h-4 w-4 text-white/70" /></button>
            </div>
          )}

          {view === 'years' && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-white/50 text-center uppercase tracking-wider">Selecciona el año</p>
            </div>
          )}

          {/* Content */}
          {view === 'days' && renderDays()}
          {view === 'months' && renderMonths()}
          {view === 'years' && renderYears()}

          {/* Footer */}
          {view === 'days' && (
            <div className="mt-4 pt-3 border-t border-[#333] flex justify-between items-center">
              <button type="button" onClick={() => { const t = new Date(); onChange(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`); setIsOpen(false); }} className="text-xs text-amber-500 font-semibold hover:text-amber-400 px-3 py-1.5 rounded-lg hover:bg-amber-500/10 transition-colors">Hoy</button>
              {value && (
                <button type="button" onClick={() => { onChange(''); setIsOpen(false); }} className="text-xs text-white/50 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors flex items-center gap-1">
                  <X className="h-3 w-3" /> Limpiar
                </button>
              )}
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
