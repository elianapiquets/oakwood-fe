import type {I18nBase} from '@shopify/hydrogen';

export interface I18nLocale extends I18nBase {
  pathPrefix: string;
}

export function getLocaleFromRequest(request: Request): I18nLocale {
  const url = new URL(request.url);
  const firstPathPart = url.pathname.split('/')[1]?.toUpperCase() ?? '';

  type I18nFromUrl = [I18nLocale['language'], I18nLocale['country']];

  let pathPrefix = '';
  let [language, country]: I18nFromUrl = ['EN', 'US'];

  if (/^[A-Z]{2}-[A-Z]{2}$/i.test(firstPathPart)) {
    pathPrefix = '/' + firstPathPart;
    [language, country] = firstPathPart.split('-') as I18nFromUrl;
  }

  return {language, country, pathPrefix};
}

/**
 * `pathPrefix` is this app's own addition to Hydrogen's i18n object (see
 * `I18nLocale`), but `context.storefront` is typed with Hydrogen's default
 * `I18nBase`, which doesn't declare it. `I18nBase` is a type alias rather than
 * an interface, so it can't be augmented — hence one cast here instead of one
 * at each of the dozen call sites.
 */
export function getPathPrefix(storefront: {i18n: I18nBase}): string {
  return (storefront.i18n as I18nLocale).pathPrefix ?? '';
}
