import { courses, modules, getCourseModules, getCourseForModule } from './catalog.js?v=20261026-textfiles';
import { learningFlow } from './learning-flow.js?v=3';

const main = document.querySelector('main');
let cleanup = () => {}, routeVersion = 0;
const curriculumFooter = document.querySelector('[data-curriculum-link]');
function showCurriculum(url = 'https://education.alberta.ca/media/159479/cse_pos.pdf') {
  curriculumFooter.hidden = false;
  curriculumFooter.innerHTML = `<a class="curriculum-source" href="${url}" target="_blank" rel="noopener">View the program of studies ↗</a>`;
}
const thumbnail = `<div class="maze-preview" aria-hidden="true">${Array.from({length: 35}, (_,i) => `<i class="${[8,9,10,15,17,22,23,24,25,26].includes(i) ? 'trail' : ''}">${i === 8 ? '●' : i === 26 ? '↗' : ''}</i>`).join('')}</div>`;

document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault(); main.focus(); main.scrollIntoView();
});

function moduleCard(module) {
  return `<a class="module-card" href="#/modules/${module.id}">
    <div class="card-top"><span class="module-code">${module.code}</span><span class="card-arrow">↗</span></div>
    <h3>${module.title}</h3><p class="topic-label">Module topics</p>
    <ul class="course-topics">${module.topics.map(topic => `<li>${topic}</li>`).join('')}</ul>
  </a>`;
}

function courseSection(course, standalone = false) {
  const items = getCourseModules(course);
  return `<section class="course-section" aria-labelledby="${course.id}-heading">
    <div class="section-heading"><div><h2 id="${course.id}-heading">${standalone ? 'Modules' : `<a href="#/courses/${course.id}">${course.title}</a>`}</h2>
      ${standalone ? '' : `<p class="class-description">${course.description}</p>`}</div>
    </div><div class="module-grid">${items.map(moduleCard).join('')}</div>
  </section>`;
}

function breadcrumb(module, demo = null) {
  const course = getCourseForModule(module.id);
  return `<nav class="breadcrumb" aria-label="Breadcrumb"><a href="#/">Classes</a>${course ? `<span>/</span><a href="#/courses/${course.id}">${course.title}</a>` : ''}<span>/</span>${demo ? `<a href="#/modules/${module.id}">${module.code}</a><span>/</span><span>${demo.title}</span>` : `<span>${module.code}</span>`}</nav>`;
}

function demonstrationCard(module, demo, index) {
  return `<a class="demo-card" href="#/demo/${module.id}/${demo.id}">
    <div class="demo-art">${thumbnail}<span class="demo-number">${String(index + 1).padStart(2, '0')}</span></div>
    <div class="demo-card-body"><h3>${demo.title} <span>↗</span></h3><p>${demo.description}</p>
    </div>
  </a>`;
}

function lessonsSection(module) {
  if (!module.lessons.length) return '';
  return `<section class="lesson-library"><div class="section-heading"><h2>Lessons</h2></div><div class="lesson-grid">${module.lessons.map(lesson => `<a class="lesson-card" href="${lesson.href}"><span class="module-code">Lesson ${lesson.number}</span><h3>${lesson.title} <span>↗</span></h3><p>${lesson.description}</p></a>`).join('')}</div></section>`;
}

async function render() {
  const version = ++routeVersion;
  cleanup(); cleanup = () => {};
  curriculumFooter.hidden = true; curriculumFooter.replaceChildren();
  const parts = location.hash.slice(1).split('/').filter(Boolean);
  const module = modules.find(module => module.id === parts[1]);
  const course = courses.find(course => course.id === parts[1]);
  window.scrollTo(0, 0);

  if (parts.length === 0) {
    document.title = 'Animated Algorithms · Course library';
    main.innerHTML = `<section class="hero learning-hero">
      <div class="hero-content">
        <h1>Computer science.<br><span>Step by step.</span></h1>
        <p class="hero-copy">Explore interactive demonstrations by class and module. Step through the logic, inspect the data, and see what happens next.</p>
      </div>${learningFlow()}
    </section>
    <section class="library" aria-labelledby="classes-heading">
      <div class="section-heading"><h2 id="classes-heading">Classes & modules</h2></div>
      <nav class="class-navigation" aria-label="Browse by class">${courses.map(course => `<a href="#/courses/${course.id}">${course.title} <span>→</span></a>`).join('')}</nav>
      ${courses.map(course => courseSection(course)).join('')}
    </section>`;
    showCurriculum();
    const textBlock = main.querySelector('.hero-content');
    const flowchart = main.querySelector('.learning-flow');
    const sizeFlowchart = () => {
      // The SVG is 400 by 560; its width keeps its height within 1.5 times
      // the whole text block, including the heading and paragraph.
      const maximumHeight = textBlock.getBoundingClientRect().height * 1.5;
      flowchart.style.setProperty('--learning-flow-width', `${maximumHeight * 400 / 560}px`);
    };
    sizeFlowchart();
    const textObserver = new ResizeObserver(sizeFlowchart);
    textObserver.observe(textBlock);
    cleanup = () => textObserver.disconnect();
  } else if (parts[0] === 'courses' && course && parts.length === 2) {
    document.title = `${course.title} · Animated Algorithms`;
    main.innerHTML = `<nav class="breadcrumb" aria-label="Breadcrumb"><a href="#/">Classes</a><span>/</span><span>${course.title}</span></nav>
      <section class="module-intro class-intro"><h1>${course.title}</h1><p>${course.description}</p>

      </section><div class="library">${courseSection(course, true)}</div>`;
    showCurriculum();
  } else if (parts[0] === 'modules' && module && parts.length === 2) {
    document.title = `${module.code} · Animated Algorithms`;
    main.innerHTML = `${breadcrumb(module)}
      <section class="module-intro"><p class="eyebrow">${module.code}</p><h1>${module.title}</h1><p>${module.description}</p></section>
      <section class="course-overview"><h2>Module topics</h2><ul class="course-topics">${(module.curriculumTopics || module.topics).map(topic => `<li>${topic}</li>`).join('')}</ul></section>
      ${lessonsSection(module)}
      <section class="library"><div class="section-heading"><h2>Interactive demonstrations</h2></div>
        ${module.demonstrations.length ? `<div class="demo-grid">${module.demonstrations.map((demo, index) => demonstrationCard(module, demo, index)).join('')}</div>` : `<div class="empty-state"><h3>${module.lessons.length ? 'No standalone demonstrations yet' : 'No demonstrations yet'}</h3><p>${module.lessons.length ? (module.lessons.length === 1 ? 'The lesson above includes interactive code examples.' : 'The lessons above include interactive code examples.') : 'Interactive demonstrations will appear here as they are added.'}</p></div>`}
      </section>`;
    if (module.curriculumUrl) showCurriculum(module.curriculumUrl);
  } else if (parts[0] === 'demo' && module && parts.length === 3 && module.demonstrations.some(demo => demo.id === parts[2])) {
    const demo = module.demonstrations.find(demo => demo.id === parts[2]);
    document.title = `${demo.title} · ${module.code}`;
    main.innerHTML = `${breadcrumb(module, demo)}<div id="demonstration"><p>Loading demonstration…</p></div>`;
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
    main.innerHTML = '<section class="module-intro"><h1>That page isn’t in the library.</h1><p><a href="#/">Return to classes →</a></p></section>';
  }
}

window.addEventListener('hashchange', render);
render();
