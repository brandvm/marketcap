// Development template › Stages: highlights the project's current stage.
// The list's data-stages is bound to the CMS Stage option; each step names
// the option it stands for. Earlier steps get is-done, the current one
// is-active and aria-current="step" (Steps List styles both).
// Markup: <ol data-stages="In Planning"> … <div data-stage-step="In Planning">
export function initProjectStages() {
  document.querySelectorAll<HTMLElement>('[data-stages]').forEach((list) => {
    const current = list.dataset.stages?.trim().toLowerCase();
    const steps = Array.from(list.querySelectorAll<HTMLElement>('[data-stage-step]'));
    const index = steps.findIndex((step) => step.dataset.stageStep?.trim().toLowerCase() === current);
    if (index < 0) return;
    steps.forEach((step, i) => {
      step.classList.toggle('is-done', i < index);
      step.classList.toggle('is-active', i === index);
      if (i === index) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
  });
}
