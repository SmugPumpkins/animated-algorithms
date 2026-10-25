import { modules } from './catalog.js';
const main = document.querySelector('main');
let cleanup = () => {}, routeVersion = 0;
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault(); main.focus(); main.scrollIntoView();
});

const thumbnail = `<div class="maze-preview" aria-hidden="true">${Array.from({length: 35}, (_,i) => `<i class="${[8,9,10,15,17,22,23,24,25,26].includes(i) ? 'trail' : ''}">${i === 8 ? '●' : i === 26 ? '↗' : ''}</i>`).join('')}</div>`;
const crumb = (module, demo = false) => `<nav class="breadcrumb" aria-label="Breadcrumb"><a href="#/">Modules</a><span>/</span>${demo ? `<a href="#/modules/${module.id}">${module.code}</a><span>/</span><span>Depth-first search</span>` : `<span>${module.code}</span>`}</nav>`;

async function render() {
  const version = ++routeVersion;
  cleanup(); cleanup = () => {};
  const parts = location.hash.slice(1).split('/').filter(Boolean);
  const module = modules.find(m => m.id === parts[1]);
  window.scrollTo(0,0);
  if (parts.length === 0) {
    document.title = 'Animated Algorithms · Module library';
    main.innerHTML = `<section class="hero"><p class="eyebrow"><span class="status-dot"></span> CTS COMPUTER SCIENCE</p><h1>Algorithms.<br><span>Made visible.</span></h1><p class="hero-copy">A place to explore how algorithms think.<br>Choose a module, open a demonstration, and take it one step at a time.</p><div class="hero-note"><span>↳</span> Interactive demonstrations for the classroom</div><div class="hero-art" aria-hidden="true"><div class="art-node">solve(current)</div><div class="art-line"></div><div class="art-diamond"><span>Base case?</span></div><div class="art-line"></div><div class="art-node accent">Explore. Return. Repeat.</div><span class="art-caption">A little less abstract.</span></div></section><section class="library" aria-labelledby="modules-heading"><div class="section-heading"><div><p class="eyebrow">THE LIBRARY</p><h2 id="modules-heading">Explore by module</h2></div><span class="count">${modules.length} module · ${modules.reduce((n,m)=>n+m.demonstrations.length,0)} demonstration</span></div><div class="module-grid">${modules.map(m=>`<a class="module-card" href="#/modules/${m.id}"><div class="card-top"><span class="module-code">${m.code}</span><span class="card-arrow">↗</span></div><div class="card-art">${thumbnail}<span class="card-art-label">THE ART OF<br>CALLING YOURSELF.</span></div><h3>${m.code} - ${m.title}</h3><p>${m.description}</p><div class="tags">${m.topics.map(t=>`<span>${t}</span>`).join('')}</div><div class="card-bottom"><span>${m.demonstrations.length} interactive demonstration</span><span>Explore module →</span></div></a>`).join('')}</div><p class="library-note">The library grows with the lessons. More modules and demonstrations can be added here.</p></section>`;
  } else if (parts[0] === 'modules' && module && parts.length === 2) {
    document.title = `${module.code} · Animated Algorithms`;
    main.innerHTML = `${crumb(module)}<section class="module-intro"><p class="eyebrow">${module.code} · CTS COMPUTER SCIENCE</p><h1>${module.title}</h1><p>${module.description}</p><div class="tags">${module.topics.map(t=>`<span>${t}</span>`).join('')}</div></section><section class="library"><div class="section-heading"><h2>Interactive demonstrations</h2><span class="count">${module.demonstrations.length} demonstration</span></div><div class="demo-grid">${module.demonstrations.map((d,i)=>`<a class="demo-card" href="#/demo/${module.id}/${d.id}"><div class="demo-art">${thumbnail}<span class="demo-number">0${i+1}</span></div><div class="demo-card-body"><p class="eyebrow">EXPLORE & BACKTRACK</p><h3>${d.title} <span>↗</span></h3><p>${d.description}</p><div class="tags">${d.tags.map(t=>`<span>${t}</span>`).join('')}</div><div class="card-bottom">Open demonstration <span>→</span></div></div></a>`).join('')}</div></section>`;
  } else if (parts[0] === 'demo' && module && parts.length === 3 && module.demonstrations.some(d => d.id === parts[2])) {
    const demo = module.demonstrations.find(d => d.id === parts[2]);
    document.title = `${demo.title} · ${module.code}`;
    main.innerHTML = `${crumb(module,true)}<div id="demonstration"><p>Loading demonstration…</p></div>`;
    try {
      const implementation = await demo.load();
      if (version !== routeVersion) return;
      cleanup = implementation.mount(document.querySelector('#demonstration'));
    } catch (error) {
      if (version !== routeVersion) return;
      document.querySelector('#demonstration').innerHTML = '<h1>Couldn’t load this demonstration</h1><p>Please reload the page and try again.</p>';
      console.error(error);
    }
  } else {
    document.title = 'Page not found · Animated Algorithms';
    main.innerHTML = '<section class="module-intro"><h1>That page isn’t in the library.</h1><p><a href="#/">Return to modules →</a></p></section>';
  }
}
window.addEventListener('hashchange', render);
render();
