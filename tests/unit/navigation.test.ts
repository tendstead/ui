import { describe, expect, it } from 'vitest';
import { activeDestination, availableDestinations, mobileDestinations, safeHref, shouldHandleNavigation } from '../../src/lib/navigation';
import type { Destination } from '../../src/lib/types';
const destinations: Destination[] = [
  { id: 'home', label: 'Home', href: '/', match: 'exact' },
  { id: 'receipts', label: 'Receipts', href: '/receipts', badge: 0 },
  { id: 'review', label: 'Review', href: '/receipts/review' },
  { id: 'secret', label: 'Secret', href: '/secret', permitted: false },
  { id: 'hidden', label: 'Hidden', href: '/hidden', visible: false },
];
describe('navigation contract', () => {
  it('filters denied and invisible destinations, keeping zero badges', () => {
    expect(availableDestinations(destinations).map(d => d.id)).toEqual(['home','receipts','review']);
    expect(availableDestinations(destinations)[1].badge).toBe(0);
  });
  it('picks most-specific segment prefix, ignoring search and hash', () => {
    expect(activeDestination(destinations, '/receipts/review/42?sort=new#top')?.id).toBe('review');
    expect(activeDestination(destinations, '/receipts/42')?.id).toBe('receipts');
    expect(activeDestination(destinations, '/receipts-archive')).toBeUndefined();
    expect(activeDestination(destinations, '/unmatched')).toBeUndefined();
    expect(activeDestination(destinations, '/?x=1')?.id).toBe('home');
    expect(activeDestination(destinations, '/secret')).toBeUndefined();
  });
  it('honors exact matching and trailing slashes', () => {
    expect(activeDestination([{ id:'x', label:'X', href:'/receipts/', match:'exact' }], '/receipts')?.id).toBe('x');
    expect(activeDestination([{ id:'x', label:'X', href:'/receipts', match:'exact' }], '/receipts/1')).toBeUndefined();
  });
  it('resolves mobile ids through registry, dropping duplicates/missing/denied ids', () => {
    expect(mobileDestinations(destinations, ['review','secret','missing','review','home']).map(d => d.id)).toEqual(['review','home']);
  });
  it('rejects non-navigation protocols while allowing routes and web links', () => {
    for (const value of ['javascript:alert(1)', ' JaVaScRiPt:alert(1)', 'java\nscript:alert(1)', 'data:text/html,hi', 'file:///etc/passwd']) expect(safeHref(value)).toBe(false);
    for (const value of ['/receipts', './receipts', '#top', '?q=x', 'https://example.test/path', 'http://localhost:8000']) expect(safeHref(value)).toBe(true);
  });
  it('preserves modified clicks, default prevention and non-left buttons', () => {
    const event = { button:0, ctrlKey:false, metaKey:false, shiftKey:false, altKey:false, defaultPrevented:false };
    expect(shouldHandleNavigation(event)).toBe(true);
    for (const key of ['ctrlKey','metaKey','shiftKey','altKey','defaultPrevented']) expect(shouldHandleNavigation({...event,[key]:true})).toBe(false);
    expect(shouldHandleNavigation({...event,button:1})).toBe(false);
  });
});
