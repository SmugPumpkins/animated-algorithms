// The home-page learning cycle uses the same semantic roles as every demo.
export function learningFlow() {
  const node = (role, y, label, shape = 'process', height = 50) => {
    const geometry = shape === 'decision'
      ? `<polygon points="150,${y - 56} 230,${y} 150,${y + 56} 70,${y}"/>`
      : `<rect x="70" y="${y - height / 2}" width="160" height="${height}" rx="${shape === 'terminator' ? height / 2 : 6}"/>`;
    return `<g class="flow-node" data-role="${role}">${geometry}<text x="150" y="${y + 5}">${label}</text></g>`;
  };
  return `<figure class="learning-flow"><svg class="flowchart" viewBox="0 0 400 560" role="img" aria-labelledby="learning-title learning-description">
    <title id="learning-title">Plan, program, debug and test</title>
    <desc id="learning-description">Start, Plan, Program, Debug, Test, End. A Repeat arrow returns from Test to Plan.</desc>
    <defs><marker id="learning-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z"/></marker></defs>
    <g class="flow-edges">
      <path d="M150 76 V115" marker-end="url(#learning-arrow)"/>
      <path d="M150 165 V191" marker-end="url(#learning-arrow)"/>
      <path d="M150 241 V270" marker-end="url(#learning-arrow)"/>
      <path d="M150 314 V334" marker-end="url(#learning-arrow)"/>
      <path d="M150 446 V478" marker-end="url(#learning-arrow)"/>
      <path d="M230 390 H340 V140 H230" marker-end="url(#learning-arrow)"/>
      <rect x="305" y="258" width="70" height="26" rx="4" fill="#090917"/>
      <text class="edge-label" x="340" y="276">Repeat</text>
    </g>
    ${node('start', 44, 'START', 'terminator', 64)}
    ${node('process', 140, 'Plan')}
    ${node('process', 216, 'Program')}
    ${node('process', 292, 'Debug.', 'process', 44)}
    ${node('decision', 390, 'Test', 'decision')}
    ${node('end', 510, 'END', 'terminator', 64)}
  </svg></figure>`;
}
