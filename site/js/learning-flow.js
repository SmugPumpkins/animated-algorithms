// The home-page learning cycle uses the same semantic roles as every demo.
export function learningFlow() {
  const box = (role, x, y, w, h, lines, shape = 'process') => {
    const geometry = shape === 'decision'
      ? `<polygon points="${x},${y-h/2} ${x+w/2},${y} ${x},${y+h/2} ${x-w/2},${y}"/>`
      : shape === 'io'
        ? `<polygon points="${x-w/2+12},${y-h/2} ${x+w/2},${y-h/2} ${x+w/2-12},${y+h/2} ${x-w/2},${y+h/2}"/>`
        : `<rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="${shape === 'terminator' ? h/2 : 5}"/>`;
    return `<g class="flow-node" data-role="${role}">${geometry}<text x="${x}" y="${y-(lines.length-1)*8+5}">${lines.map((line,i)=>`<tspan x="${x}" dy="${i ? 16 : 0}">${line}</tspan>`).join('')}</text></g>`;
  };
  return `<figure class="learning-flow"><svg class="flowchart" viewBox="0 0 560 520" role="img" aria-labelledby="learning-title learning-description">
    <title id="learning-title">Plan, program, debug, repeat</title>
    <desc id="learning-description">Start, plan, program, and debug. Repeat? Yes loops back to plan. No leads to taking a break.</desc>
    <defs><marker id="learning-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z"/></marker></defs>
    <g class="flow-edges">
      <path d="M235 48 V81" marker-end="url(#learning-arrow)"/>
      <path d="M235 127 V157" marker-end="url(#learning-arrow)"/>
      <path d="M235 203 V233" marker-end="url(#learning-arrow)"/>
      <path d="M235 279 V317" marker-end="url(#learning-arrow)"/>
      <path d="M235 403 V440" marker-end="url(#learning-arrow)"/>
      <path d="M330 360 H470 V104 H345" marker-end="url(#learning-arrow)"/>
      <text class="edge-label" x="398" y="348">Yes</text>
      <text class="edge-label" x="260" y="426">No</text>
    </g>
    ${box('start',235,28,180,40,['Start'],'terminator')}
    ${box('process',235,104,220,46,['Plan'])}
    ${box('process',235,180,220,46,['Program'])}
    ${box('process',235,256,220,46,['Debug'])}
    ${box('decision',235,360,190,86,['Repeat?'],'decision')}
    ${box('end',235,462,220,44,['Take a break.'],'terminator')}
  </svg></figure>`;
}
