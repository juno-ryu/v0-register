import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import ko from '@/i18n/locales/ko.json'

// 레거시 i18n/index.js 포팅
// 현재 서비스는 한국어 단일 언어 사용
i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
  },
  lng: 'ko',
  fallbackLng: 'ko',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
