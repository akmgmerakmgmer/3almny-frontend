"use client";
import en from './messages/en.json';
import ar from './messages/ar.json';
import {useParams} from 'next/navigation';

const dictionaries: Record<string, Record<string,string>> = { en, ar };

export function useT(explicitLang?: string) {
  const params = useParams();
  const lang = (explicitLang || (params?.lang as string) || 'en');
  const dict = dictionaries[lang] || dictionaries.en;
  function t(key: string, fallback?: string) {
    return dict[key] || fallback || key;
  }
  return { t, lang };
}
