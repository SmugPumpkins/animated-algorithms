// Semantic roles are independent of shape and execution state.
// Shared CSS tokens live in flowcharts.css; see docs/design-system.md.
export const FLOW_ROLES = Object.freeze({
  parameter: 'Input / parameters',
  start: 'Start',
  end: 'End',
  decision: 'Decision',
  process: 'Process',
  return: 'Return',
  predefined: 'Predefined process',
  output: 'Output',
});

export function flowLegend(roles = Object.keys(FLOW_ROLES)) {
  return `<div class="flow-legend" aria-label="Flowchart colour key">${roles.map(role => {
    if (!Object.hasOwn(FLOW_ROLES, role)) throw new Error(`Unknown flowchart role: ${role}`);
    return `<span data-role="${role}"><i aria-hidden="true"></i>${FLOW_ROLES[role]}</span>`;
  }).join('')}</div>`;
}
