import test from 'node:test';
import assert from 'node:assert/strict';
import { courses, modules, getCourseModules, getCourseForModule } from '../site/js/catalog.js';

test('class and module URLs are unique and every module is discoverable', () => {
  assert.equal(new Set(courses.map(course => course.id)).size, courses.length);
  assert.equal(new Set(modules.map(module => module.id)).size, modules.length);
  const reachable = new Set();
  for (const course of courses) {
    assert.match(course.id, /^[a-z0-9-]+$/);
    assert.equal(new Set(course.moduleIds).size, course.moduleIds.length);
    const items = getCourseModules(course);
    assert.equal(items.length, course.moduleIds.length);
    for (const module of items) reachable.add(module.id);
  }
  assert.deepEqual(reachable, new Set(modules.map(module => module.id)));
  for (const module of modules) {
    assert.match(module.id, /^[a-z0-9-]+$/);
    assert.ok(getCourseForModule(module.id));
    assert.ok(module.title && module.description && module.topics.length);
    assert.equal(new Set(module.demonstrations.map(demo => demo.id)).size, module.demonstrations.length);
  }
});

test('invalid class references cannot silently create missing module links', () => {
  assert.throws(() => getCourseModules({ id: 'invalid', moduleIds: ['missing'] }), /Unknown module/);
});

test('registered demonstration entry points load and implement mount', async () => {
  for (const module of modules) {
    for (const demonstration of module.demonstrations) {
      const implementation = await demonstration.load();
      assert.equal(typeof implementation.mount, 'function');
    }
  }
});
