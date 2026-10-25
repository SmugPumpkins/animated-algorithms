// Add modules and demonstrations here. Each demonstration owns its rendering
// and returns a cleanup function, so timers and listeners never leak across pages.
export const modules = [{
  id: 'cse3310', code: 'CSE 3310', title: 'Recursive Algorithms 1',
  description: 'Recursive control flow, divide and conquer, and recursive searching and sorting.',
  topics: ['Recursive functions', 'Divide and conquer', 'Searching and sorting'],
  curriculumTopics: [
    'Base cases, head/tail recursion and the system stack',
    'Divide and conquer; recursion versus iteration',
    'Time and space efficiency',
    'Recursive binary search',
    'Quicksort, merge sort and heapsort',
    'Recursion and dynamic data structures',
  ],
  curriculumUrl: 'https://education.alberta.ca/media/159479/cse_pos.pdf',
  demonstrations: [{
    id: 'depth-first-search', title: 'Depth-first search',
    description: 'Help a mouse find the exit. Follow recursive calls through a maze and see how backtracking builds a path.',
    tags: ['Maze solving', 'Flowchart', 'Call stack'],
    load: () => import('./algorithms/dfs-demo.js'),
  }],
}];
