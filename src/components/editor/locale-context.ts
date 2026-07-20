'use client';

import { createContext, useContext } from 'react';
import { DEFAULT_LOCALE, type Locale } from './i18n';

const EditorLocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export const EditorLocaleProvider = EditorLocaleContext.Provider;

export function useEditorLocale(): Locale {
  return useContext(EditorLocaleContext);
}
