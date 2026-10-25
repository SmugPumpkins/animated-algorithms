import { modules } from './catalog.js';
import { learningFlow } from './learning-flow.js';
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
    main.innerHTML = `<section class="hero learning-hero">
      <div class="hero-content"><p class="eyebrow"><span class="status-dot"></span> CTS COMPUTER SCIENCE</p>
      <h1>Computer science.<br><span>Step by step.</span></h1>
      <p class="hero-copy">Explore interactive demonstrations by course module. Step through the logic, inspect the data, and see what happens next.</p></div>
      ${learningFlow()}
    </section>
    <section class="library" aria-labelledby="modules-heading">
      <div class="section-heading"><h2 id="modules-heading">Course modules</h2><span class="count">${modules.length} module · ${modules.reduce((n,m)=>n+m.demonstrations.length,0)} demonstration</span></div>
      <div class="module-grid">${modules.map(m=>`<a class="module-card" href="#/modules/${m.id}">
        <div class="card-top"><span class="module-code">${m.code}</span><span class="card-arrow">↗</span></div>
        <h3>${m.title}</h3><p class="topic-label">Course topics</p>
        <ul class="course-topics">${(m.curriculumTopics || m.topics).map(t=>`<li>${t}</li>`).join('')}</ul>
        <div class="card-bottom"><span>${m.demonstrations.length} demonstration available</span><span>Open module →</span></div>
      </a>`).join('')}</div>
      <p class="curriculum-source">Course topics: <a href="https://education.alberta.ca/media/159479/cse_pos.pdf" target="_blank" rel="noopener">Alberta Computing Science program of studies ↗</a></p>
    </section>`;
  } else if (parts[0] === 'modules' && module && parts.length === 2) {
    document.title = `${module.code} · Animated Algorithms`;
    main.innerHTML = `${crumb(module)}<section class="module-intro"><p class="eyebrow">${module.code} · CTS COMPUTER SCIENCE</p><h1>${module.title}</h1><p>${module.description}</p><div class="tags">${module.topics.map(t=>`<span>${t}</span>`).join('')}</div></section><section class="course-overview"><h2>Course topics</h2><ul class="course-topics">${(module.curriculumTopics || module.topics).map(t=>`<li>${t}</li>`).join('')}</ul>${module.curriculumUrl ? `<a class="curriculum-source" href="${module.curriculumUrl}" target="_blank" rel="noopener">View the program of studies ↗</a>` : ''}</section><section class="library"><div class="section-heading"><h2>Interactive demonstrations</h2><span class="count">${module.demonstrations.length} demonstration</span></div><div class="demo-grid">${module.demonstrations.map((d,i)=>`<a class="demo-card" href="#/demo/${module.id}/${d.id}"><div class="demo-art">${thumbnail}<span class="demo-number">0${i+1}</span></div><div class="demo-card-body"><p class="eyebrow">EXPLORE & BACKTRACK</p><h3>${d.title} <span>↗</span></h3><p>${d.description}</p><div class="tags">${d.tags.map(t=>`<span>${t}</span>`).join('')}</div><div class="card-bottom">Open demonstration <span>→</span></div></div></a>`).join('')}</div></section>`;
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
