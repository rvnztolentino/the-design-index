/**
 * Template modals.
 *
 * Every card is a real link to the template file, so with JavaScript off (or
 * on a middle/modifier click) it still goes somewhere useful — the preview.
 * With JavaScript on we intercept and open the matching <dialog> instead.
 *
 * Escape, the focus trap, focus restore and inertness of the page behind are
 * all handled by showModal() natively; only opening, the close button and the
 * click-outside need code.
 */

const isPlainClick = (event: MouseEvent) =>
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey;

document.addEventListener("click", (event) => {
  const target = event.target as Element | null;
  if (!target) return;

  const trigger = target.closest<HTMLAnchorElement>("a[data-template]");
  if (trigger && isPlainClick(event)) {
    const dialog = document.getElementById(`modal-${trigger.dataset.template}`);
    if (dialog instanceof HTMLDialogElement) {
      event.preventDefault();
      dialog.showModal();
    }
    return;
  }

  const dialog = target.closest("dialog");
  if (!(dialog instanceof HTMLDialogElement)) return;

  // The backdrop dispatches its clicks on the dialog element itself, so a
  // click whose target is the dialog and not its contents is a click outside.
  if (target === dialog || target.closest("[data-close]")) {
    dialog.close();
  }
});
