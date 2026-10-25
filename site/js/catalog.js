// Add modules and demonstrations here. Each demonstration owns its rendering
// and returns a cleanup function, so timers and listeners never leak across pages.
const curriculumUrl = 'https://education.alberta.ca/media/159479/cse_pos.pdf';

// Class membership is data, not a fixed two-class layout. Add a course here
// and reference any module IDs from the module registry below.
export const courses = [
  {
    id: 'foundations', title: 'Computer Science Foundations',
    description: 'Programming fundamentals, robotics, functions and data structures.',
    moduleIds: ['cse1110', 'cse1120', 'cse1240', 'cse2110', 'cse2120'],
  },
  {
    id: 'certifications', title: 'Computer Science Certifications',
    description: 'File handling, iterative algorithms, object-oriented programming and recursion.',
    moduleIds: ['cse2130', 'cse3110', 'cse3120', 'cse3130', 'cse3310'],
  },
];

function moduleEntry(code, title, description, topics, lessons = []) {
  return {
    id: code.replace(' ', '').toLowerCase(), code, title, description, topics,
    curriculumTopics: topics, curriculumUrl, demonstrations: [], lessons,
  };
}

export const modules = [
  moduleEntry('CSE 1110', 'Structured Programming 1',
    'Write sequential programs that accept, process and output data.',
    ['Sequential algorithms', 'Variables and data types', 'Input, processing and output'], [{
      id: 'introduction-to-python', number: 1, title: 'Introduction to Python',
      description: 'Python datatypes, variables and console output.',
      slideCount: 16, href: './lessons/cse1110/introduction-to-python/',
    }]),
  moduleEntry('CSE 1120', 'Structured Programming 2',
    'Add decisions, repetition and blocks to structured programs.',
    ['Selection and decisions', 'Loops and repetition', 'Program blocks']),
  moduleEntry('CSE 1240', 'Robotics Programming 1',
    'Design and debug programs that control robots.',
    ['Robot control', 'Robotic environments', 'Structured robot programs']),
  moduleEntry('CSE 2110', 'Procedural Programming 1',
    'Break programs into reusable procedures and functions.',
    ['Modular design', 'Functions and procedures', 'Parameters and scope']),
  moduleEntry('CSE 2120', 'Data Structures 1',
    'Organize related data using arrays and records.',
    ['Arrays and indexing', 'Records', 'Structured data processing']),
  moduleEntry('CSE 2130', 'Files & File Structures 1',
    'Store and retrieve program data using files.',
    ['File organization', 'Reading and writing files', 'Sequential and random access']),
  moduleEntry('CSE 3110', 'Iterative Algorithm 1',
    'Develop iterative algorithms for searching and sorting.',
    ['Iterative searching', 'Iterative sorting', 'Algorithm efficiency']),
  moduleEntry('CSE 3120', 'Object-oriented Programming 1',
    'Design programs using classes and interacting objects.',
    ['Classes and objects', 'Attributes and methods', 'Encapsulation']),
  moduleEntry('CSE 3130', 'Object-oriented Programming 2',
    'Extend object-oriented designs through reusable class relationships.',
    ['Inheritance and polymorphism', 'Class relationships', 'Abstract classes and UML']),
  {
    id: 'cse3310', code: 'CSE 3310', title: 'Recursive Algorithms 1',
    lessons: [],
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
  },
];


export function getCourseModules(course) {
  return course.moduleIds.map(id => {
    const module = modules.find(module => module.id === id);
    if (!module) throw new Error(`Unknown module ${id} in ${course.id}`);
    return module;
  });
}

export function getCourseForModule(moduleId) {
  return courses.find(course => course.moduleIds.includes(moduleId));
}
