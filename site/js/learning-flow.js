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
  return `<figure class="learning-flow"><svg class="flowchart" viewBox="0 0 560 565" role="img" aria-labelledby="learning-title learning-description">
    <title id="learning-title">Learning computer science</title>
    <desc id="learning-description">Pick a problem, read and ask questions, plan a solution, build and test it. If it fails a test, debug and try again. If it passes, explain why it works and level up.</desc>
    <defs><marker id="learning-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z"/></marker></defs>
    <g class="flow-edges">
      <path d="M240 50 V80" marker-end="url(#learning-arrow)"/>
      <path d="M240 120 V149" marker-end="url(#learning-arrow)"/>
      <path d="M240 195 V225" marker-end="url(#learning-arrow)"/>
      <path d="M240 271 V295" marker-end="url(#learning-arrow)"/>
      <path d="M240 385 V424" marker-end="url(#learning-arrow)"/>
      <path d="M240 468 V503" marker-end="url(#learning-arrow)"/>
      <path d="M340 340 H465 V271" marker-end="url(#learning-arrow)"/>
      <path d="M465 225 V205 H365 V248 H350" marker-end="url(#learning-arrow)"/>
      <text class="edge-label" x="260" y="409">Yes</text>
      <text class="edge-label" x="404" y="331">No</text>
    </g>
    ${box('start',240,30,180,40,['Pick a problem.'],'terminator')}
    ${box('parameter',240,100,220,40,['Read. Ask questions.'],'io')}
    ${box('process',240,172,220,46,['Plan a solution.'])}
    ${box('process',240,248,220,46,['Build it. Test it.'])}
    ${box('decision',240,340,200,90,['Passes every','test case?'],'decision')}
    ${box('process',465,248,160,46,['Debug.','Again.'])}
    ${box('output',240,446,220,44,['Explain why it works.'],'io')}
    ${box('end',240,523,180,40,['Level up.'],'terminator')}
  </svg><figcaption>The debugging loop is part of the syllabus.</figcaption></figure>`;
}
