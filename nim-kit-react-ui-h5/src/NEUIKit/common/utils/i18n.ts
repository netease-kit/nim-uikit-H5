import en from '../locales/en'
import zh from '../locales/zh'

const i18nData: any = {
  en,
  zh
}

let currentLanguage: string = localStorage.getItem('switchToEnglishFlag') === 'en' ? 'en' : 'zh'

export function setLanguage(language: string) {
  currentLanguage = language
}

export const t = (key: string) => {
  return i18nData[currentLanguage][key] || key
}
