
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
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
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
                    ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-4
                    bg-white/50 dark:bg-slate-900/50 
                    backdrop-blur-md
                    border border-slate-200 dark:border-slate-700 
                    rounded-2xl 
                    shadow-sm
                    text-slate-800 dark:text-slate-100 placeholder-slate-400
                    outline-none 
                    transition-all duration-300
                    focus:bg-white dark:focus:bg-slate-900
                    focus:ring-2 focus:ring-temple-gold/30 focus:border-temple-gold
                    focus:shadow-lg focus:shadow-temple-gold/10
                    group-hover:border-slate-300 dark:group-hover:border-slate-600
                `}
            />
            {/* Bottom Glow Line */}
            <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-temple-gold/50 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500" />
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
                    flex items-center gap-2 px-5 py-4
                    bg-white/50 dark:bg-slate-900/50 
                    backdrop-blur-md
                    border border-slate-200 dark:border-slate-700 
                    rounded-2xl 
                    shadow-sm hover:shadow-md 
                    transition-all duration-200 
                    w-full md:w-auto justify-between md:justify-start
                    group
                `}
            >
                {Icon && <Icon className="w-4 h-4 text-slate-400 group-hover:text-temple-saffron transition-colors" />}
                <span className="font-medium text-sm text-slate-700 dark:text-slate-200">{selectedLabel}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="
                    absolute z-50 mt-3 w-64 origin-top-right 
                    bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl 
                    rounded-2xl shadow-2xl shadow-temple-stone/20 dark:shadow-black/50
                    border border-slate-100 dark:border-slate-700 
                    overflow-hidden animate-in fade-in zoom-in-95 duration-200
                ">
                    <div className="py-2 max-h-72 overflow-y-auto custom-scrollbar">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`
                                    w-full text-left px-5 py-3 text-sm 
                                    flex items-center justify-between
                                    transition-all duration-200
                                    border-l-4 border-transparent
                                    ${value === option.value
                                        ? 'bg-temple-gold/10 text-temple-saffron border-temple-saffron font-bold'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300'}
                                `}
                            >
                                <span>{option.label}</span>
                                {value === option.value && <Check className="w-4 h-4 text-temple-saffron" />}
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
