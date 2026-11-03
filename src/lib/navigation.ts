import type { Destination } from './types';
/** Configuration comes from the app. Filtering is presentation, never authorization. */
export function safeHref(value: string): boolean {
  const normalized = value.replace(/[\u0000-\u0020\u007f]/g, '');
  const protocol = normalized.match(/^([a-z][a-z\d+.-]*):/i)?.[1].toLowerCase();
  return !protocol || protocol === 'http' || protocol === 'https';
}
export function availableDestinations(destinations: Destination[]): Destination[] {
  return destinations.filter(d => d.visible !== false && d.permitted !== false && safeHref(d.href));
}
function path(value: string): string {
  return (value.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/');
}
export function activeDestination(destinations: Destination[], pathname: string): Destination | undefined {
  const current = path(pathname);
  return availableDestinations(destinations)
    .filter(d => {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(d.href)) return false;
      const target = path(d.href);
      return current === target || (d.match !== 'exact' && target !== '/' && current.startsWith(`${target}/`));
    })
    .sort((a,b) => path(b.href).length - path(a.href).length)[0];
}
export function mobileDestinations(destinations: Destination[], ids: string[]): Destination[] {
  const registry = new Map(availableDestinations(destinations).map(d => [d.id,d]));
  return [...new Set(ids)].flatMap(id => registry.has(id) ? [registry.get(id)!] : []);
}
export function shouldHandleNavigation(event: Pick<MouseEvent, 'button' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey' | 'defaultPrevented'>): boolean {
  return !event.defaultPrevented && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
}
