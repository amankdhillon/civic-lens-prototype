// Where an agenda item stands, shown as text steps. The current step is marked for screen readers and by its shape and weight, not color alone.
import { esc } from '../lib/dom.js';
import { STAGES, STAGE_LABEL } from '../config.js';

export function stageSteps(stage) {
  if (stage === 'information_only' || stage === 'continued') {
    return `<p><span class="badge">${esc(STAGE_LABEL[stage])}</span></p>`;
  }
  const idx = STAGES.indexOf(stage);
  const decided = stage === 'decided';
  return `
    <ol class="stages" aria-label="Where this item stands">
      ${STAGES.map((s, i) => {
        const done = decided || i < idx;
        const current = !decided && i === idx;
        const cls = done ? 'done' : current ? 'current' : '';
        const prefix = done ? '<span class="sr-only">Done: </span>' : current ? '<span class="sr-only">Current: </span>' : '';
        return `<li class="${cls}"${current ? ' aria-current="step"' : ''}>${prefix}${esc(STAGE_LABEL[s])}</li>`;
      }).join('')}
    </ol>`;
}
