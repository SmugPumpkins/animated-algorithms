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
  return `<figure class="learning-flow"><svg class="flowchart" viewBox="0 0 560 710" role="img" aria-labelledby="learning-title learning-description">
    <title id="learning-title">Plan, implement, debug and submit</title>
    <desc id="learning-description">Start. Input instruction. Plan a solution, implement a program, and debug. Does it work? No returns to planning; Yes leads to output submission, then End.</desc>
    <defs><marker id="learning-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z"/></marker></defs>
    <g class="flow-edges">
      <path d="M235 58 V88" marker-end="url(#learning-arrow)"/>
      <path d="M235 152 V187" marker-end="url(#learning-arrow)"/>
      <path d="M235 243 V277" marker-end="url(#learning-arrow)"/>
      <path d="M235 333 V364" marker-end="url(#learning-arrow)"/>
      <path d="M235 412 V440" marker-end="url(#learning-arrow)"/>
      <path d="M235 548 V569" marker-end="url(#learning-arrow)"/>
      <path d="M235 633 V654" marker-end="url(#learning-arrow)"/>
      <path d="M335 494 H405 V215 H345" marker-end="url(#learning-arrow)"/>
      <text class="edge-label" x="370" y="484">No</text>
      <text class="edge-label" x="255" y="562">Yes</text>
    </g>
    ${box('start',235,32,180,52,['START'],'terminator')}
    ${box('parameter',235,120,200,64,['INPUT','instruction'],'io')}
    ${box('process',235,215,220,56,['Plan a solution.'])}
    ${box('process',235,305,220,56,['Implement a','program.'])}
    ${box('process',235,388,180,48,['Debug.'])}
    ${box('decision',235,494,200,108,['Does it work?'],'decision')}
    ${box('output',235,601,200,64,['OUTPUT','submission'],'io')}
    ${box('end',235,676,180,44,['END'],'terminator')}
  </svg></figure>`;
}
