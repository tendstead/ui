<script lang="ts">
  import { onMount } from 'svelte';
  import { AppShell, type Destination } from '@tendstead/ui';
  import { LayoutDashboard, ReceiptText, Search, Plus, Settings, ListChecks, FolderDown, Download, History, CircleHelp, ArrowUpRight, FileText } from '@lucide/svelte';
  const query=new URLSearchParams(window.location.search);
  const downloader=query.get('app')==='downloader';
  let theme=$state(query.get('theme')==='dark'?'dark':'light');
  let long=$state(query.get('long')==='1');
  let showAccount=$state(query.get('account')==='1');
  let showServices=$state(query.get('services')==='1');
  let permitted=$state(query.get('denied')!=='1');
  let mounted=$state(true);
  let pathname=$state(query.get('route')??window.location.pathname);
  let status=$state('');
  let url=$state('');
  let receiptName=$state('');
  let queued=$state(2);
  let activeTitle=$derived(downloader ? (pathname.startsWith('/history')?'History':pathname.startsWith('/settings')?'Settings':'Downloads') : (pathname==='/add'?'Add receipt':pathname.startsWith('/receipts/review')?'Review queue':pathname.startsWith('/receipts')?'Receipts':pathname.startsWith('/search')?'Search':pathname.startsWith('/settings')?'Settings':'Overview'));
  let destinations=$derived<Destination[]>(downloader ? [
    {id:'downloads',label:long?'Aktuelle und ausstehende Downloads':'Downloads',href:'/',icon:FolderDown,match:'exact',badge:queued,groupId:'workspace'},
    {id:'history',label:long?'Vollständiger Downloadverlauf':'History',href:'/history',icon:History,groupId:'workspace'},
    {id:'settings',label:long?'Einstellungen und Konfiguration':'Settings',href:'/settings',icon:Settings,groupId:'manage'},
    {id:'help',label:'Help',href:'/help',icon:CircleHelp,groupId:'manage'},
  ] : [
    {id:'overview',label:long?'Haushaltsübersicht und Zusammenfassung':'Overview',href:'/',icon:LayoutDashboard,match:'exact',groupId:'workspace'},
    {id:'receipts',label:long?'Belege und Haushaltsabrechnungen':'Receipts',href:'/receipts',icon:ReceiptText,badge:0,permitted,groupId:'workspace'},
    {id:'review',label:long?'Belege zur Überprüfung und Freigabe':'Review queue',href:'/receipts/review',icon:ListChecks,badge:3,permitted,groupId:'workspace'},
    {id:'search',label:long?'Belege und Dokumente durchsuchen':'Search',href:'/search',icon:Search,groupId:'workspace'},
    {id:'settings',label:long?'Einstellungen und Haushaltsverwaltung':'Settings',href:'/settings',icon:Settings,groupId:'manage'},
    {id:'private',label:'Private admin',href:'/admin',icon:Settings,visible:false,groupId:'manage'},
  ]);
  const groups=[{id:'workspace',label:'Workspace'},{id:'manage',label:'Manage'}];
  function go(href:string) {
    pathname=href;
    const search=new URLSearchParams(window.location.search); search.delete('route');
    window.history.pushState({},'',`${href}${search.size?'?'+search:''}`);
    status='';
  }
  function navigate(event:MouseEvent,destination:Destination) { event.preventDefault();go(destination.href); }
  function add() { if(downloader){ document.getElementById('download-url')?.focus(); }else go('/add'); }
  onMount(()=>{ const pop=()=>pathname=window.location.pathname; window.addEventListener('popstate',pop); return ()=>window.removeEventListener('popstate',pop); });
</script>

<div data-theme={theme} class="demo-root">
  {#snippet account()}
    <button class="demo-account" type="button" onclick={()=>status='Demo account controls opened'}><span class="demo-avatar" aria-hidden="true">A</span><span>Alex · local account</span></button>
  {/snippet}
  {#if mounted}
    <AppShell brand="Tendstead" appLabel={downloader?'Downloader':'Receipts'} pageTitle={activeTitle} {pathname} {destinations} {groups}
      mobilePrimaryIds={downloader?['downloads','history']:['overview','receipts','search']}
      primaryAction={{id:'add',label:downloader?'New download':'Add',icon:downloader?Download:Plus,onclick:add}}
      serviceLinks={showServices?[{id:'other',label:downloader?'Receipts':'Downloader',href:downloader?'https://receipts.example.test/':'https://downloader.example.test/',icon:downloader?ReceiptText:FolderDown}]:[]}
      account={showAccount?account:undefined} onNavigate={navigate}>
      {#snippet pageActions()}<button class="demo-subtle-button" onclick={()=>status='Synthetic export prepared'} type="button"><ArrowUpRight size={16} aria-hidden="true"/><span>Export</span></button>{/snippet}
      <div class="demo-intro"><p class="demo-kicker">YOUR HOUSEHOLD, A LITTLE LIGHTER</p><h2>{downloader?'Bring your downloads together.':'Room for the everyday.'}</h2><p>{downloader?'Keep track of files in one calm place.':'Keep receipts close, find what you need, and carry on with your day.'}</p></div>
      <div class="demo-notice"><span class="demo-dot" aria-hidden="true"></span>Synthetic demo · local interactions only</div>
      {#if downloader}
        <section class="demo-card" aria-labelledby="download-form-title"><div class="demo-card-header"><h2 id="download-form-title">Add a download</h2><span class="demo-tag">No login</span></div><form onsubmit={(event)=>{event.preventDefault();queued+=1;status='Added to the synthetic queue';url='';}}><label for="download-url">Download URL</label><div class="demo-form-row"><input id="download-url" type="url" bind:value={url} placeholder="https://example.test/file.zip" required/><button class="demo-primary-button" type="submit">Queue demo download</button></div><p class="demo-help">This fixture adds a local sample entry. It does not fetch a file.</p></form></section>
      {:else if pathname==='/add'}
        <section class="demo-card" aria-labelledby="receipt-form-title"><h2 id="receipt-form-title">Receipt details</h2><form onsubmit={(event)=>{event.preventDefault();status=`Saved synthetic receipt: ${receiptName}`;}}><label for="receipt-name">Receipt name</label><input id="receipt-name" bind:value={receiptName} required placeholder="Weekly groceries"/><label for="receipt-date">Purchase date</label><input id="receipt-date" type="date" value="2026-10-31"/><button class="demo-primary-button" type="submit">Save demo receipt</button></form></section>
      {:else if pathname.startsWith('/search')}
        <section class="demo-card"><label for="receipt-search">Search receipts</label><input id="receipt-search" type="search" placeholder="Shop, date, or note" oninput={(event)=>status=event.currentTarget.value?`Synthetic results for “${event.currentTarget.value}”`:''}/></section>
      {/if}
      <div class="demo-stats"><section class="demo-stat"><p>{downloader?'In the queue':'This month'}</p><strong>{downloader?queued:'€284.50'}</strong><span>{downloader?'Ready when you are':'Across 12 receipts'}</span></section><section class="demo-stat"><p>{downloader?'Completed':'Ready to review'}</p><strong>{downloader?'18':'3'}</strong><span>{downloader?'Sample downloads':'A quick check is all it takes'}</span></section><section class="demo-stat"><p>{downloader?'Storage used':'Your archive'}</p><strong>{downloader?'2.4 GB':'148'}</strong><span>{downloader?'Synthetic files':'Receipts, neatly kept'}</span></section></div>
      <section class="demo-card" aria-labelledby="activity-title"><div class="demo-card-header"><div><p class="demo-kicker">AT A GLANCE</p><h2 id="activity-title">{downloader?'Recent downloads':'Recent receipts'}</h2></div><span class="demo-tag">Sample data</span></div><div class="demo-items">{#each (downloader?['Household manual.pdf','Weekend photos.zip','Garden notes.txt']:['Weekly groceries','Home essentials','Coffee with friends','Garden supplies']) as label,index}<div class="demo-item"><span class="demo-file-icon" aria-hidden="true"><FileText size={20}/></span><div><strong>{label}</strong><span>{['31 October 2026','29 October 2026','28 October 2026','26 October 2026'][index]} · {downloader?'Complete':'Personal'}</span></div><span class="demo-item-value">{downloader?['4.2 MB','128 MB','12 KB'][index]:['€68.40','€24.90','€12.80','€47.60'][index]}</span></div>{/each}</div></section>
      <details class="demo-fixtures" open={query.get('controls')==='1'}><summary>Demo configuration</summary><div class="demo-controls"><label>Appearance<select bind:value={theme}><option value="light">Light</option><option value="dark">Dark</option></select></label><label><input type="checkbox" bind:checked={long}/>Long German labels</label><label><input type="checkbox" bind:checked={showServices}/>Show connected services</label><label><input type="checkbox" bind:checked={showAccount}/>Show account controls</label>{#if !downloader}<label><input type="checkbox" bind:checked={permitted}/>Allow receipt access</label>{/if}<p class="demo-help">App servers must enforce permissions. These controls only change navigation presentation.</p></div></details>
      <section class="demo-card demo-notes"><h2>A place for the small things</h2><p>This page intentionally includes enough content to scroll. The shell keeps the last control clear of the mobile navigation.</p><p>Each household tool owns its data, routes, and permissions. Connected services are ordinary links to independently deployed apps.</p><button class="demo-subtle-button" type="button" onclick={()=>status='End of page action received'}>End of page action</button></section>
      <p role="status" class="demo-status">{status}</p>
      <button class="demo-subtle-button demo-unmount" type="button" onclick={()=>mounted=false}>Unmount shell</button>
    </AppShell>
  {:else}<div class="demo-unmounted"><h1>Shell unmounted</h1><button onclick={()=>mounted=true}>Mount shell</button></div>{/if}
</div>
