import { translations } from "../values/translations"
import * as Localization from "expo-localization"
import { I18n } from "i18n-js"

export const useTranslation = (): I18n => {
  const i18n = new I18n(translations)
  i18n.locale = Localization.locale
  i18n.enableFallback = true
  i18n.defaultLocale = "en"

  return i18n
}
