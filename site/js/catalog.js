// Add modules and demonstrations here. Each demonstration owns its rendering
// and returns a cleanup function, so timers and listeners never leak across pages.
export const modules = [{
  id: 'cse3310', code: 'CSE 3310', title: 'Recursive Algorithms 1',
  description: 'Follow the calls. Find the base case. Watch a solution unfold, one recursive step at a time.',
  topics: ['Recursion', 'Base cases', 'Backtracking'],
  demonstrations: [{
    id: 'depth-first-search', title: 'Depth-first search',
    description: 'Help a mouse find the exit. Follow recursive calls through a maze and see how backtracking builds a path.',
    tags: ['Maze solving', 'Flowchart', 'Call stack'],
    load: () => import('./algorithms/dfs-demo.js'),
  }],
}];
