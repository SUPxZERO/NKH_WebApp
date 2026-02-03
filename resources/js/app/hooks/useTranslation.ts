import { useLanguage } from '../context/LanguageContext';

export const useTranslation = () => {
    const { t, locale, setLocale, translations } = useLanguage();
    return { t, locale, setLocale, translations };
};
