import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  flag: string;
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const languages: Language[] = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'da', name: 'Dansk', flag: '🇩🇰' },
  ];

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  const currentLanguage = languages.find((lang) => lang.code === i18n.language);

  return (
    <Select value={i18n.language} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[140px]">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <SelectValue>
            {currentLanguage && (
              <span className="flex items-center gap-2">
                <span>{currentLanguage.flag}</span>
                <span>{currentLanguage.name}</span>
              </span>
            )}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
