/**
 * i18n Context - Lightweight Translation System
 * ================================================
 * Wraps the existing TRANSLATIONS object in a React context
 * so components can use useTranslation() hook instead of
 * prop-drilling `lang` through the component tree.
 */

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { TRANSLATIONS } from '../components/translations';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
    const [lang, setLang] = useState('EN');

    const t = useCallback((key, fallback) => {
        const translations = TRANSLATIONS[lang] || TRANSLATIONS.EN;
        return translations[key] || fallback || key;
    }, [lang]);

    const value = useMemo(() => ({
        lang,
        setLang,
        t,
        translations: TRANSLATIONS[lang] || TRANSLATIONS.EN,
    }), [lang, t]);

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useTranslation must be used within an I18nProvider');
    }
    return context;
}

export default useTranslation;
