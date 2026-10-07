// Development template › Stages: marks each stage from its CMS State.
// Every Stage Rows item carries data-stage-state bound to the State option
// (Done / Current / Upcoming). Done gets is-done, Current gets is-active and
// aria-current="step" (Steps List styles both); Upcoming stays dimmed.
// The progress line ([data-stages-progress], in the same list wrapper) runs
// from the viewport edge to the centre of the last Done or Current marker
// (each item's first child), and is measured again on resize.
// Markup: <div class="steps-list-item" data-stage-state="Current">
export function initProjectStages() {
  const steps = Array.from(document.querySelectorAll<HTMLElement>('[data-stage-state]'));
  steps.forEach((step) => {
    const state = step.dataset.stageState?.trim().toLowerCase();
    step.classList.toggle('is-done', state === 'done');
    step.classList.toggle('is-active', state === 'current');
    if (state === 'current') step.setAttribute('aria-current', 'step');
    else step.removeAttribute('aria-current');
  });

  document.querySelectorAll<HTMLElement>('[data-stages-progress]').forEach((progress) => {
    const items = Array.from(progress.parentElement?.querySelectorAll<HTMLElement>('[data-stage-state]') ?? []);
    const reached = items.filter((s) => s.classList.contains('is-done') || s.classList.contains('is-active')).pop();
    const marker = reached?.firstElementChild as HTMLElement | null | undefined;
    const fit = () => {
      if (!marker) return void (progress.style.width = '0px');
      const m = marker.getBoundingClientRect();
      const start = progress.getBoundingClientRect().left;
      progress.style.width = `${Math.max(0, m.left + m.width / 2 - start)}px`;
    };
    fit();
    window.addEventListener('resize', fit);
  });
}
