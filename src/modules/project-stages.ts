// Development template › Stages: marks each stage from its CMS State.
// Every Stage Rows item carries data-stage-state bound to the State option
// (Done / Current / Upcoming). Done gets is-done, Current gets is-active and
// aria-current="step" (Steps List styles both); Upcoming stays dimmed.
// Markup: <div class="steps-list-item" data-stage-state="Current">
export function initProjectStages() {
  document.querySelectorAll<HTMLElement>('[data-stage-state]').forEach((step) => {
    const state = step.dataset.stageState?.trim().toLowerCase();
    step.classList.toggle('is-done', state === 'done');
    step.classList.toggle('is-active', state === 'current');
    if (state === 'current') step.setAttribute('aria-current', 'step');
    else step.removeAttribute('aria-current');
  });
}
