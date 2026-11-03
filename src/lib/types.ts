import type { Component, Snippet } from 'svelte';
export type ShellIcon = Component<{ size?: number | string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
export interface Destination { id: string; label: string; href: string; icon?: ShellIcon; groupId?: string; badge?: string | number; visible?: boolean; permitted?: boolean; match?: 'exact' | 'prefix' }
export interface NavigationGroup { id: string; label: string }
export interface ServiceLink { id: string; label: string; href: string; icon?: ShellIcon }
export interface PrimaryAction { id: string; label: string; icon?: ShellIcon; href?: string; onclick?: (event: MouseEvent) => void }
export interface AppShellProps { brand: string; appLabel: string; pageTitle: string; pathname: string; destinations: Destination[]; groups?: NavigationGroup[]; mobilePrimaryIds?: string[]; primaryAction?: PrimaryAction; serviceLinks?: ServiceLink[]; onNavigate?: (event: MouseEvent, destination: Destination) => void; children: Snippet; pageActions?: Snippet; account?: Snippet }
