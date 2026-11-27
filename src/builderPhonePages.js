// A page contains the original controls. The next page changes visibility, so
// validation, focus targets and edits still use the same form elements.
export function createPhonePager(viewport, getItems, onPageChange) {
  const openSelect = CSS.supports('selector(select:open)') ? 'select:open' : null;
  let items = [];
  let pages = [];
  let index = 0;
  let frame = 0;
  let pickerRetry = 0;
  let selectPointer = null;
  let observed = new Set();
  const resize = new ResizeObserver(schedule);
  const scrollRegion = viewport.querySelector('[data-phone-page-scroll]');
  let scrollPosition = [0, 0];

  function rememberScroll() {
    if (scrollRegion?.clientHeight) scrollPosition = [scrollRegion.scrollLeft, scrollRegion.scrollTop];
  }

  function showPage(page) {
    index = Math.max(0, Math.min(page, pages.length - 1));
    const visible = new Set(pages[index]);
    for (const item of items) item.toggleAttribute('data-phone-offscreen', !visible.has(item));
    for (const item of observed) {
      if (!visible.has(item)) resize.unobserve(item);
    }
    for (const item of visible) {
      if (!observed.has(item)) resize.observe(item);
    }
    observed = visible;
    onPageChange(index, pages.length);
    if (scrollRegion?.clientHeight) scrollRegion.scrollTo(...scrollPosition);
  }

  function refresh(target) {
    cancelAnimationFrame(frame);
    frame = 0;
    clearTimeout(pickerRetry);
    pickerRetry = 0;
    if (!document.body.classList.contains('builder-mobile') || !viewport.clientHeight) return;
    if (!target && selectPointer !== null) return;

    const active = document.activeElement;
    // Measuring pages briefly hides their fields, which dismisses native select menus.
    if (!target && openSelect && viewport.contains(active) && active.matches(openSelect)) {
      pickerRetry = setTimeout(() => {
        pickerRetry = 0;
        schedule();
      }, 120);
      return;
    }
    const focused = viewport.contains(active) && active.getClientRects().length ? active : null;
    const anchor = target || focused || pages[index]?.[0];
    rememberScroll();
    viewport.setAttribute('data-phone-measuring', '');
    for (const item of items) {
      item.removeAttribute('data-phone-page-item');
      item.removeAttribute('data-phone-offscreen');
    }
    items = [...getItems()].filter(item => item.getClientRects().length ||
      (getComputedStyle(item).display === 'contents' && item.firstElementChild?.getClientRects().length));
    for (const item of items) {
      item.setAttribute('data-phone-page-item', '');
      item.setAttribute('data-phone-offscreen', '');
    }
    viewport.removeAttribute('data-phone-measuring');

    pages = [];
    let page = [];
    for (const item of items) {
      item.removeAttribute('data-phone-offscreen');
      const standalone = item.hasAttribute('data-phone-page-alone');
      const startsPage = standalone || item.hasAttribute('data-phone-page-start');
      if (page.length && (startsPage || viewport.scrollHeight > viewport.clientHeight + 1)) {
        for (const previous of page) previous.setAttribute('data-phone-offscreen', '');
        pages.push(page);
        page = [];
      }
      if (standalone) {
        pages.push([item]);
        item.setAttribute('data-phone-offscreen', '');
      } else {
        page.push(item);
      }
    }
    if (page.length) pages.push(page);

    const matchedPage = anchor
      ? pages.findIndex(group => group.some(item => item.contains(anchor) || anchor.contains(item)))
      : -1;
    showPage(matchedPage >= 0 ? matchedPage : index);
    if (focused && focused !== document.activeElement && focused.getClientRects().length) {
      focused.focus({ preventScroll: true });
    }
  }

  function schedule() {
    if (!frame && !pickerRetry) frame = requestAnimationFrame(() => refresh());
  }

  viewport.addEventListener('pointerdown', event => {
    if (event.target.matches('select:not(:disabled)')) selectPointer = event.pointerId;
  });
  const finishSelectPress = event => {
    if (event.pointerId !== selectPointer) return;
    selectPointer = null;
    schedule();
  };
  window.addEventListener('pointerup', finishSelectPress, true);
  window.addEventListener('pointercancel', finishSelectPress, true);

  new MutationObserver(changes => {
    if (changes.some(change => change.target.nodeName !== 'CANVAS')) schedule();
  }).observe(viewport, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'hidden', 'open', 'style'],
  });
  resize.observe(viewport);

  return {
    refresh,
    schedule,
    reset() {
      index = 0;
      pages = [];
      scrollPosition = [0, 0];
      schedule();
    },
    canMove(delta) {
      return index + delta >= 0 && index + delta < pages.length;
    },
    move(delta) {
      if (!this.canMove(delta)) return false;
      rememberScroll();
      showPage(index + delta);
      return true;
    },
  };
}

export function connectPhonePageControls(viewport, getItems, controls, onPageChange) {
  const previous = controls.querySelector('[data-page-back]');
  const next = controls.querySelector('[data-page-next]');
  const status = controls.querySelector('[data-page-count]');
  const pager = createPhonePager(viewport, getItems, (index, total) => {
    previous.disabled = index === 0;
    next.disabled = index + 1 >= total;
    controls.toggleAttribute('data-single-page', total < 2);
    status.textContent = total > 1 ? `${index + 1} / ${total}` : '';
    onPageChange?.();
  });
  previous.addEventListener('click', () => {
    previous.focus({ preventScroll: true });
    pager.move(-1);
  });
  next.addEventListener('click', () => {
    next.focus({ preventScroll: true });
    pager.move(1);
  });
  return pager;
}
