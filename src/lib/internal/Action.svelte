<script lang="ts">
  import type { PrimaryAction } from '../types';
  import { safeHref } from '../navigation';
  let { action, mobile=false }: { action:PrimaryAction; mobile?:boolean } = $props();
</script>
{#snippet label()}
  {#if action.icon}<action.icon size={21} aria-hidden="true"/>{/if}
  <span>{action.label}</span>
{/snippet}
{#if action.href && safeHref(action.href)}
  <a class:ts-mobile-action={mobile} class="ts-action" href={action.href}>{@render label()}</a>
{:else if !action.href}
  <button class:ts-mobile-action={mobile} class="ts-action" type="button" onclick={action.onclick}>{@render label()}</button>
{/if}
