
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Calendar } from 'lucide-react';

/* 
  OMNI-UI GEN 3.0 - DIVINE DNA LIBRARY
  "Sacred Geometry & Glass Physics"
*/

// --- 1. THE PRESSED INPUT (Search / Text) ---
export const OmniInput = ({
    icon: Icon,
    value,
    onChange,
    placeholder,
    type = "text",
    className = ""
}) => {
    return (
        <div className={`relative group ${className}`}>
            {Icon && (
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Icon className="h-5 w-5 text-slate-400 group-focus-within:text-temple-saffron transition-colors duration-300" />
                </div>
            )}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`
                    w-full 
                    ${Icon ? 'pl-14' : 'pl-6'} pr-6 py-4
                    bg-white/60 dark:bg-slate-900/40 
                    backdrop-blur-xl
                    border border-white/40 dark:border-white/10
                    rounded-2xl 
                    shadow-sm
                    text-base font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400/80
                    outline-none 
                    transition-all duration-300
                    focus:bg-white dark:focus:bg-slate-900
                    focus:ring-4 focus:ring-amber-500/10 focus:border-temple-gold/50
                    focus:shadow-lg focus:shadow-temple-gold/5
                    group-hover:border-white/60 dark:group-hover:border-white/20
                `}
            />
            {/* Bottom Glow Line */}
            <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-temple-gold/60 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-700 ease-out" />
        </div>
    );
};

// --- 2. THE FLOATING DROPDOWN (Maasa / Ritu / Sort) ---
export const OmniDropdown = ({
    label,
    options,
    value,
    onChange,
    icon: Icon
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLabel = options.find(o => o.value === value)?.label || label;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-3 px-6 py-4
                    bg-white/60 dark:bg-slate-900/40 
                    backdrop-blur-xl
                    border border-white/40 dark:border-white/10
                    rounded-2xl 
                    shadow-sm hover:shadow-md 
                    transition-all duration-200 
                    w-full md:w-auto justify-between md:justify-start
                    group active:scale-95
                `}
            >
                {Icon && <Icon className="w-5 h-5 text-slate-400 group-hover:text-temple-saffron transition-colors" />}
                <span className="font-medium text-base text-slate-700 dark:text-slate-200">{selectedLabel}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-temple-saffron' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="
                    absolute z-50 mt-3 w-72 origin-top-right 
                    bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl 
                    rounded-3xl shadow-2xl shadow-temple-stone/10 dark:shadow-black/60
                    border border-white/20 dark:border-white/5 
                    overflow-hidden animate-in fade-in zoom-in-95 duration-200
                ">
                    <div className="py-2 max-h-80 overflow-y-auto custom-scrollbar p-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`
                                    w-full text-left px-5 py-4 text-sm rounded-2xl
                                    flex items-center justify-between
                                    transition-all duration-200
                                    mb-1 last:mb-0
                                    ${value === option.value
                                        ? 'bg-amber-50 dark:bg-amber-900/30 text-temple-saffron font-bold shadow-sm'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5 hover:text-slate-800'}
                                `}
                            >
                                <span>{option.label}</span>
                                {value === option.value && <Check className="w-5 h-5 text-temple-saffron" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- 3. THE COSMIC TOGGLE (Switch) ---
export const OmniToggle = ({ label, checked, onChange }) => {
    return (
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onChange(!checked)}>
            <div className={`
                relative w-12 h-7 transition-colors duration-500 rounded-full 
                ${checked
                    ? 'bg-gradient-to-r from-temple-gold to-temple-saffron shadow-[0_0_15px_rgba(234,88,12,0.4)]'
                    : 'bg-slate-200 dark:bg-slate-700'}
            `}>
                <div className={`
                    absolute left-1 top-1 bg-white w-5 h-5 rounded-full shadow-md transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
                    ${checked ? 'translate-x-5 scale-110' : 'translate-x-0'}
                `} />
            </div>
            {label && (
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-temple-saffron transition-colors">
                    {label}
                </span>
            )}
        </div>
    );
};
