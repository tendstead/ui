<script lang="ts">
  import type { ModalProps } from './types';

  let { title, open = $bindable(false), closeLabel = 'Close', returnFocus, children }: ModalProps = $props();
  const titleId = $props.id();
  let dialog: HTMLDialogElement;

  $effect(() => {
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  });

  function handleClose() {
    // A native close event can arrive after the consumer has reopened the dialog.
    if (dialog.open) return;
    open = false;
    returnFocus?.focus({ preventScroll: true });
  }
</script>

<dialog bind:this={dialog} aria-labelledby={titleId} onclose={handleClose}>
  <div class="heading">
    <h2 id={titleId}>{title}</h2>
    <button type="button" onclick={() => (open = false)}>{closeLabel}</button>
  </div>
  {@render children()}
</dialog>

<style>
  dialog {
    box-sizing: border-box;
    inline-size: min(var(--ts-modal-max-width, 60rem), calc(100% - 24px));
    max-block-size: calc(100dvh - 24px);
    padding: 16px;
    overflow: auto;
    overscroll-behavior: contain;
    border: 1px solid var(--ts-border);
    border-radius: 12px;
    background: var(--ts-surface);
    color: var(--ts-text);
    font-family: var(--ts-font);
  }

  dialog::backdrop {
    background: rgb(17 14 23 / 60%);
  }

  .heading {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 12px;
    margin-block-end: 12px;
  }

  h2 {
    margin: 0;
    font-size: 1.125rem;
    overflow-wrap: anywhere;
  }

  button {
    flex: 0 0 auto;
    min-block-size: 44px;
    max-inline-size: 50%;
    padding: 8px 12px;
    border: 1px solid var(--ts-border);
    border-radius: 9px;
    background: var(--ts-surface);
    color: inherit;
    font: inherit;
    overflow-wrap: anywhere;
    cursor: pointer;
  }

  button:hover {
    background: var(--ts-selection);
    color: var(--ts-on-selection);
  }

  button:focus-visible {
    outline: 3px solid var(--ts-focus);
    outline-offset: 3px;
  }
</style>
