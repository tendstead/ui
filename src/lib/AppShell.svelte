<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createDialog } from '@melt-ui/svelte';
  import type { AppShellProps, Destination } from './types';
  import { activeDestination, availableDestinations, mobileDestinations, safeHref, shouldHandleNavigation } from './navigation';
  import NavigationList from './internal/NavigationList.svelte';
  import DestinationLink from './internal/DestinationLink.svelte';
  import Action from './internal/Action.svelte';
  let { brand, appLabel, pageTitle, pathname, destinations, groups=[], mobilePrimaryIds=[], primaryAction, serviceLinks=[], onNavigate, children, pageActions, account }:AppShellProps=$props();
  const uid=$props.id();
  const {elements:{trigger,overlay,content,title,description,close},states:{open}}=createDialog({portal:null});
  let available=$derived(availableDestinations(destinations));
  let active=$derived(activeDestination(destinations,pathname));
  let mobile=$derived(mobileDestinations(destinations,mobilePrimaryIds));
  let services=$derived(serviceLinks.filter(s=>safeHref(s.href)));
  let mobileBar:HTMLElement;
  let barHeight=$state(100);
  function navigate(event:MouseEvent,destination:Destination) {
    if (!shouldHandleNavigation(event)) return;
    onNavigate?.(event,destination);
    open.set(false);
  }
  // Recover focus when reactive app configuration removes the focused snippet.
  // Melt remains responsible for trapping and returning focus during normal use.
  function recoverDetachedFocus(node:HTMLElement) {
    let focused:Element|null=node.contains(document.activeElement)?document.activeElement:null;
    const remember=(event:FocusEvent)=>{ focused=event.target as Element; };
    node.addEventListener('focusin',remember);
    const observer=new MutationObserver(()=>{
      if(focused && !focused.isConnected && !node.contains(document.activeElement)) {
        node.focus({preventScroll:true});
      }
    });
    observer.observe(node,{childList:true,subtree:true});
    return {destroy(){ observer.disconnect();node.removeEventListener('focusin',remember); }};
  }
  onMount(()=>{
    const desktop=window.matchMedia('(min-width: 768px)');
    const resized=()=>{ if(desktop.matches) open.set(false); };
    desktop.addEventListener('change',resized);
    const observer=new ResizeObserver(entries=>{ barHeight=entries[0].borderBoxSize[0]?.blockSize ?? mobileBar.offsetHeight; });
    observer.observe(mobileBar);
    return ()=>{ desktop.removeEventListener('change',resized); observer.disconnect(); };
  });
  onDestroy(()=>open.set(false));
</script>

{#snippet brandBlock()}
  <div class="ts-brand"><span class="ts-brand-mark" aria-hidden="true">t</span><div><strong>{brand}</strong><span class="ts-app-label">{appLabel}</span></div></div>
{/snippet}
{#snippet servicesBlock()}
  {#if services.length}
    <nav class="ts-services" aria-label="Connected services">
      <h2 class="ts-section-label">Connected services</h2>
      {#each services as service (service.id)}
        <a class="ts-nav-link" href={service.href}>
          {#if service.icon}<service.icon size={21} aria-hidden="true"/>{/if}
          <span class="ts-nav-label">{service.label}</span><span aria-hidden="true">↗</span>
        </a>
      {/each}
    </nav>
  {/if}
{/snippet}

<div class="ts-shell" style:--ts-mobile-space={`${barHeight+24}px`}>
  <div class="ts-shell-background" data-shell-background inert={$open}>
    <a class="ts-skip" href={`#${uid}-content`}>Skip to content</a>
    <aside class="ts-sidebar">
      {@render brandBlock()}
      <nav class="ts-main-nav" aria-label="Main navigation"><NavigationList destinations={available} {groups} activeId={active?.id} onclick={navigate}/></nav>
      {@render servicesBlock()}
      {#if account}<div class="ts-account">{@render account()}</div>{/if}
      <p class="ts-sidebar-note">A little more in order.</p>
    </aside>
    <div class="ts-workspace">
      <header class="ts-header">
        <div class="ts-page-heading"><p class="ts-eyebrow">{appLabel}</p><h1>{pageTitle}</h1></div>
        <div class="ts-header-actions">{#if pageActions}{@render pageActions()}{/if}{#if primaryAction}<div class="ts-desktop-action"><Action action={primaryAction}/></div>{/if}</div>
      </header>
      <main id={`${uid}-content`} class="ts-page-content" tabindex="-1">{@render children()}</main>
    </div>
    <nav class="ts-mobile-bar" bind:this={mobileBar} aria-label="Mobile navigation">
      {#each mobile as destination,index (destination.id)}
        {#if primaryAction && index===Math.ceil(mobile.length/2)}<Action action={primaryAction} mobile/>{/if}
        <DestinationLink {destination} active={active?.id===destination.id} onclick={navigate}/>
      {/each}
      {#if primaryAction && mobile.length<2}<Action action={primaryAction} mobile/>{/if}
      <button class="ts-menu-trigger" {...$trigger} use:trigger>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg><span>Menu</span>
      </button>
    </nav>
  </div>
  {#if $open}
    <div class="ts-overlay" data-drawer-overlay {...$overlay} use:overlay></div>
    <div class="ts-drawer" {...$content} use:content use:recoverDetachedFocus>
      <div class="ts-drawer-heading"><h2 {...$title} use:title>All destinations</h2><button class="ts-icon-button" aria-label="Close menu" {...$close} use:close>✕</button></div>
      <p class="ts-drawer-description" {...$description} use:description>{brand} · {appLabel}</p>
      <nav class="ts-drawer-nav" aria-label="All navigation"><NavigationList destinations={available} {groups} activeId={active?.id} onclick={navigate}/></nav>
      {@render servicesBlock()}
      {#if account}<div class="ts-account">{@render account()}</div>{/if}
    </div>
  {/if}
</div>
