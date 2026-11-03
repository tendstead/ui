<script lang="ts">
  import type { Destination } from '../types';
  let { destination, active = false, onclick }: { destination: Destination; active?: boolean; onclick?: (event: MouseEvent, destination: Destination) => void } = $props();
</script>
<a class="ts-nav-link" href={destination.href} aria-current={active ? 'page' : undefined} onclick={(event) => onclick?.(event, destination)}>
  {#if destination.icon}<destination.icon size={21} aria-hidden="true" />{/if}
  <span class="ts-nav-label">{destination.label}</span>
  {#if destination.badge !== undefined}<span class="ts-badge">{destination.badge}</span>{/if}
</a>
