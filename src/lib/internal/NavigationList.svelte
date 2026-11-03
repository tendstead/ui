<script lang="ts">
  import type { Destination, NavigationGroup } from '../types';
  import DestinationLink from './DestinationLink.svelte';
  let { destinations, groups, activeId, onclick }: { destinations: Destination[]; groups: NavigationGroup[]; activeId?: string; onclick: (event:MouseEvent, destination:Destination)=>void } = $props();
  let ungrouped = $derived(destinations.filter(d=>!d.groupId || !groups.some(g=>g.id===d.groupId)));
</script>
{#each ungrouped as destination (destination.id)}<DestinationLink {destination} active={activeId===destination.id} {onclick}/>{/each}
{#each groups as group (group.id)}
  {@const items=destinations.filter(d=>d.groupId===group.id)}
  {#if items.length}
    <section class="ts-nav-group" aria-label={group.label}>
      <h2 class="ts-section-label">{group.label}</h2>
      {#each items as destination (destination.id)}<DestinationLink {destination} active={activeId===destination.id} {onclick}/>{/each}
    </section>
  {/if}
{/each}
