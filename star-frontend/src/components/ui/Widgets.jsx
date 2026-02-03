
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Calendar } from 'lucide-react';

/* 
  OMNI-UI GEN 2.0 - CORE DNA LIBRARY
  "Golden Ratio Geometry & Physical Inputs"
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
                    <Icon className="h-5 w-5 text-gray-400 group-focus-within:text-amber-500 transition-colors duration-300" />
                </div>
            )}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`
                    w-full 
                    ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3 
                    bg-gray-100/50 dark:bg-slate-800/50 
                    border border-gray-200 dark:border-slate-700 
                    rounded-xl 
                    shadow-inner 
                    text-gray-800 dark:text-gray-100 placeholder-gray-400
                    outline-none 
                    transition-all duration-300
                    focus:bg-white dark:focus:bg-slate-900
                    focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500
                    focus:shadow-lg
                `}
            />
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
                    flex items-center gap-2 px-4 py-3 
                    bg-white dark:bg-slate-800 
                    border border-gray-200 dark:border-slate-700 
                    rounded-xl 
                    shadow-sm hover:shadow-md 
                    transition-all duration-200 
                    w-full md:w-auto justify-between md:justify-start
                    group
                `}
            >
                {Icon && <Icon className="w-4 h-4 text-gray-400 group-hover:text-amber-500 transition-colors" />}
                <span className="font-medium text-sm text-gray-700 dark:text-gray-200">{selectedLabel}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 mt-2 w-56 origin-top-right bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-1 max-h-60 overflow-y-auto">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`
                                    w-full text-left px-4 py-3 text-sm 
                                    flex items-center justify-between
                                    transition-colors duration-150
                                    ${value === option.value
                                        ? 'bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-100 font-semibold'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-800'}
                                `}
                            >
                                <span>{option.label}</span>
                                {value === option.value && <Check className="w-4 h-4 text-amber-500" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- 3. THE iOS TOGGLE (Checkboxes) ---
export const OmniToggle = ({ label, checked, onChange }) => {
    return (
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onChange(!checked)}>
            <div className={`
                relative w-11 h-6 transition-colors duration-300 rounded-full 
                ${checked ? 'bg-green-500' : 'bg-gray-200 dark:bg-slate-700'}
            `}>
                <div className={`
                    absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300
                    ${checked ? 'translate-x-5' : 'translate-x-0'}
                `} />
            </div>
            {label && (
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 transition-colors">
                    {label}
                </span>
            )}
        </div>
    );
};
