import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSteps,MAZE,START,END,cellKey} from '../site/js/algorithms/dfs-engine.js';
import {nodes} from '../site/js/algorithms/dfs-flow.js';
import {Player} from '../site/js/player.js';
test('DFS finds a connected, walkable route from start to exit',()=>{
  const steps=buildSteps(), final=steps.at(-1), path=new Set(final.solution);
  assert.equal(final.returning,true); assert.deepEqual(final.stack,[]);
  assert.ok(path.has(cellKey(START))&&path.has(cellKey(END)));
  const reached=new Set(), queue=[START];
  while(queue.length){const p=queue.pop(),key=cellKey(p);if(reached.has(key))continue;reached.add(key);assert.equal(MAZE[p[0]][p[1]],0);for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){const n=[p[0]+dr,p[1]+dc];if(path.has(cellKey(n))&&!reached.has(cellKey(n)))queue.push(n);}}
  assert.equal(reached.size,path.size);
  assert.ok(steps.every(s=>nodes[s.node]),'Every instruction maps to a flowchart node');
  assert.ok(steps.some(s=>s.node==='FALSE_VISITED'));
  assert.ok(steps.some(s=>s.failed.length>0),'Demo includes backtracking');
});
test('snapshots are independent and generation is repeatable',()=>{
  const steps=buildSteps();assert.equal(steps[0].visited.length,0);assert.equal(steps[0].solution.length,0);
  assert.deepEqual(steps,buildSteps());
});
test('base cases handle bounds, walls, exit, and an unsolvable maze',()=>{
  assert.equal(buildSteps([[1]],[0,0],[0,0]).at(-1).returning,false);
  assert.ok(buildSteps([[0]],[-1,0],[0,0]).some(s=>s.node==='FALSE_BOUNDS'));
  assert.equal(buildSteps([[0]],[0,0],[0,0]).at(-1).returning,true);
  const steps=buildSteps([[0,1,0]],[0,0],[0,2]);
  assert.equal(steps.at(-1).returning,false);assert.equal(steps.at(-1).solution.length,0);
});
test('playback respects all speeds, pausing, looping, end stop, and scrubbing',()=>{
  for(const speed of [.25,1,10]){
    const p=new Player(5);p.setSpeed(speed,0);p.toggle(0);
    assert.equal(p.tick(1000/speed-1),false);assert.equal(p.index,0);
    assert.equal(p.tick(1000/speed),true);assert.equal(p.index,1);
    p.toggle(1000/speed);p.tick(1e6);assert.equal(p.index,1);
  }
  const p=new Player(3);p.toggle(0);p.tick(1000);p.tick(2000);
  assert.equal(p.index,2);assert.equal(p.playing,false);
  p.toggle(3000);assert.equal(p.index,0);p.loop=true;
  p.tick(4000);p.tick(5000);p.tick(6000);assert.equal(p.index,0);assert.equal(p.playing,true);
  p.seek(999,7000);assert.equal(p.index,2);assert.equal(p.playing,false);
  p.seek(-10,8000);assert.equal(p.index,0);
});
