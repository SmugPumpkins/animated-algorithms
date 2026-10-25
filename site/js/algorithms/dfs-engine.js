export const MAZE = [
  [1,1,1,1,1,1,1], [1,0,0,0,1,0,1], [1,0,1,0,1,0,1],
  [1,0,1,0,0,0,1], [1,0,0,0,1,0,1], [1,1,1,1,1,1,1],
];
export const START = [1,1];
export const END = [4,5];
export const cellKey = ([r,c]) => `${r},${c}`;
const directions = [[-1,0,'UP'],[1,0,'DOWN'],[0,1,'RIGHT'],[0,-1,'LEFT']];

// Snapshots make backward stepping and timeline scrubbing deterministic.
export function buildSteps(maze = MAZE, start = START, end = END) {
  const steps = [], visited = new Set(), failed = new Set(), solution = new Set(), stack = [];
  let mouse = start;
  const record = (node, message, candidate = null, returning = null) => steps.push({
    node, message, candidate, returning, mouse: [...mouse],
    visited: [...visited], failed: [...failed], solution: [...solution], stack: stack.map(p => [...p]),
  });
  function solve(row, col) {
    const position = [row,col], key = cellKey(position);
    stack.push(position);
    record('CALL', `Call solve(${row}, ${col}).`, position);
    record('BOUNDS', 'Is the current position inside the maze?', position);
    if (row < 0 || row >= maze.length || col < 0 || col >= maze[row].length) {
      record('FALSE_BOUNDS', 'Outside the maze. Return False to the caller.', position, false);
      stack.pop(); return false;
    }
    record('WALL', 'Is the current cell a wall?', position);
    if (maze[row][col] === 1) {
      record('FALSE_WALL', 'A wall blocks this direction. Return False.', position, false);
      stack.pop(); return false;
    }
    record('VISITED', 'Have we already visited this cell?', position);
    if (visited.has(key)) {
      record('FALSE_VISITED', 'Already visited. Return False to avoid a cycle.', position, false);
      stack.pop(); return false;
    }
    mouse = position;
    record('EXIT', 'Is the current cell the exit?', position);
    if (key === cellKey(end)) {
      solution.add(key);
      record('TRUE_EXIT', 'Exit found! Return True to the caller.', null, true);
      stack.pop(); return true;
    }
    visited.add(key);
    record('MARK', `Mark (${row}, ${col}) as visited.`);
    for (const [dr,dc,direction] of directions) {
      const next = [row+dr,col+dc];
      record(direction, `Try ${direction.toLowerCase()}: solve(${next.join(', ')}).`, next);
      const found = solve(...next);
      mouse = position;
      record(`CHECK_${direction}`, `${direction} returned ${found ? 'True' : 'False'}.${found ? '' : ' Try the next direction.'}`, next, found);
      if (found) {
        solution.add(key);
        record(`TRUE_${direction}`, `Pass True back from (${row}, ${col}). This cell belongs to the solution.`, null, true);
        stack.pop(); return true;
      }
    }
    failed.add(key);
    record('FALSE_END', 'All four directions failed. Return False and backtrack.', null, false);
    stack.pop(); return false;
  }
  record('CALL', 'Ready to explore. Press Play or take the first step.');
  const found = solve(...start);
  const finalNode = steps.at(-1).node;
  record(finalNode, found ? 'Search complete. The green cells trace the path to the exit.' : 'Search complete. No path to the exit exists.', null, found);
  return steps;
}
