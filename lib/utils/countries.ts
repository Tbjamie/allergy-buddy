// lib/constants/countries.ts

export type EmergencyNumbers = {
  general?: string
  ambulance?: string
  police?: string
  fire?: string
  touristPolice?: string
  notes?: string
}

export type CountryOption = {
  code: string
  nameNl: string
  nameEn: string
  flag: string
  mainLanguage: string
  emergencyNumbers: EmergencyNumbers
}

export const countries: CountryOption[] = [
  {
    code: 'TR',
    nameNl: 'Turkije',
    nameEn: 'Turkey',
    flag: '🇹🇷',
    mainLanguage: 'tr',
    emergencyNumbers: {
      general: '112',
      notes: '112 is het centrale noodnummer in Turkije.',
    },
  },
  {
    code: 'NL',
    nameNl: 'Nederland',
    nameEn: 'Netherlands',
    flag: '🇳🇱',
    mainLanguage: 'nl',
    emergencyNumbers: {
      general: '112',
    },
  },
  {
    code: 'BE',
    nameNl: 'België',
    nameEn: 'Belgium',
    flag: '🇧🇪',
    mainLanguage: 'nl',
    emergencyNumbers: {
      general: '112',
      police: '101',
    },
  },
  {
    code: 'DE',
    nameNl: 'Duitsland',
    nameEn: 'Germany',
    flag: '🇩🇪',
    mainLanguage: 'de',
    emergencyNumbers: {
      general: '112',
      police: '110',
    },
  },
  {
    code: 'FR',
    nameNl: 'Frankrijk',
    nameEn: 'France',
    flag: '🇫🇷',
    mainLanguage: 'fr',
    emergencyNumbers: {
      general: '112',
      ambulance: '15',
      police: '17',
      fire: '18',
    },
  },
  {
    code: 'ES',
    nameNl: 'Spanje',
    nameEn: 'Spain',
    flag: '🇪🇸',
    mainLanguage: 'es',
    emergencyNumbers: {
      general: '112',
    },
  },
  {
    code: 'IT',
    nameNl: 'Italië',
    nameEn: 'Italy',
    flag: '🇮🇹',
    mainLanguage: 'it',
    emergencyNumbers: {
      general: '112',
    },
  },
  {
    code: 'GB',
    nameNl: 'Verenigd Koninkrijk',
    nameEn: 'United Kingdom',
    flag: '🇬🇧',
    mainLanguage: 'en',
    emergencyNumbers: {
      general: '999',
      notes: '112 werkt meestal ook vanaf mobiele telefoons.',
    },
  },
  {
    code: 'US',
    nameNl: 'Verenigde Staten',
    nameEn: 'United States',
    flag: '🇺🇸',
    mainLanguage: 'en',
    emergencyNumbers: {
      general: '911',
    },
  },
  {
    code: 'CA',
    nameNl: 'Canada',
    nameEn: 'Canada',
    flag: '🇨🇦',
    mainLanguage: 'en',
    emergencyNumbers: {
      general: '911',
    },
  },
  {
    code: 'AU',
    nameNl: 'Australië',
    nameEn: 'Australia',
    flag: '🇦🇺',
    mainLanguage: 'en',
    emergencyNumbers: {
      general: '000',
      notes: '112 werkt vaak vanaf mobiele telefoons.',
    },
  },
  {
    code: 'TH',
    nameNl: 'Thailand',
    nameEn: 'Thailand',
    flag: '🇹🇭',
    mainLanguage: 'th',
    emergencyNumbers: {
      general: '191',
      ambulance: '1669',
      touristPolice: '1155',
    },
  },
  {
    code: 'MA',
    nameNl: 'Marokko',
    nameEn: 'Morocco',
    flag: '🇲🇦',
    mainLanguage: 'ar',
    emergencyNumbers: {
      ambulance: '150',
      police: '190',
      fire: '15',
    },
  },
  {
    code: 'AE',
    nameNl: 'Verenigde Arabische Emiraten',
    nameEn: 'United Arab Emirates',
    flag: '🇦🇪',
    mainLanguage: 'ar',
    emergencyNumbers: {
      ambulance: '998',
      police: '999',
      fire: '997',
    },
  },
]