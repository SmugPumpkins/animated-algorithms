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
    }, {
      id: 'input-process-output', number: 2, title: 'Input, Process, Output',
      description: 'IPO planning, real terminal input, numeric casting, output formatting and escape characters.',
      slideCount: 17, href: './lessons/cse1110/input-process-output/',
    }, {
      id: 'algorithms', number: 3, title: 'Algorithms',
      description: 'Algorithms, structured programming, sequence, selection and iteration.',
      slideCount: 8, href: './lessons/cse1110/algorithms/',
    }, {
      id: 'flowcharts', number: 4, title: 'Visualizing Algorithms with Flowcharts',
      description: 'Flowchart symbols and step-by-step diagrams for sequence, selection and iteration.',
      slideCount: 14, href: './lessons/cse1110/flowcharts/',
    }, {
      id: 'pseudocode', number: 5, title: 'Structuring Algorithms with Pseudocode',
      description: 'Plain-language algorithms, pseudocode keywords, control structures and indentation.',
      slideCount: 11, href: './lessons/cse1110/pseudocode/',
    }]),
  moduleEntry('CSE 1120', 'Structured Programming 2',
    'Add decisions, repetition and blocks to structured programs.',
    ['Selection and decisions', 'Loops and repetition', 'Program blocks']),
  moduleEntry('CSE 1240', 'Robotics Programming 1',
    'Design and debug programs that control robots.',
    ['Robot control', 'Robotic environments', 'Structured robot programs']),
  moduleEntry('CSE 2110', 'Procedural Programming 1',
    'Break programs into reusable procedures and functions.',
    ['Modular design', 'Functions and procedures', 'Parameters and scope'], [{
      id: 'focus-on-functions', number: 1, title: 'Focus on Functions',
      description: 'Procedural design, single-purpose functions, stubs, type hints and docstrings.',
      slideCount: 16, href: './lessons/cse2110/focus-on-functions/',
    }, {
      id: 'external-modules', number: 2, title: 'External Modules',
      description: 'Importing Python modules, testing reusable functions and documenting their interfaces.',
      slideCount: 13, href: './lessons/cse2110/external-modules/',
    }]),
  moduleEntry('CSE 2120', 'Data Structures 1',
    'Organize related data using arrays and records.',
    ['Arrays and indexing', 'Records', 'Structured data processing'], [{
      id: 'manipulating-strings', number: 1, title: 'Manipulating Strings',
      description: 'String methods for capitalization, whitespace, splitting, replacing, joining and numeric conversion.',
      slideCount: 10, href: './lessons/cse2120/manipulating-strings/',
    }, {
      id: 'lists', number: 2, title: 'Lists',
      description: 'Creating, indexing, modifying, traversing and copying Python lists.',
      slideCount: 22, href: './lessons/cse2120/lists/',
    }, {
      id: 'tuples', number: 3, title: 'Tuples',
      description: 'Ordered collections, tuple traversal, immutability and mutable objects inside tuples.',
      slideCount: 6, href: './lessons/cse2120/tuples/',
    }, {
      id: 'dictionaries', number: 4, title: 'Dictionaries',
      description: 'Key-value pairs, dictionary methods, traversal, copying and references.',
      slideCount: 17, href: './lessons/cse2120/dictionaries/',
    }, {
      id: 'data-classes', number: 5, title: 'Data Classes',
      description: 'Declared fields, type annotations, instances and dot notation.',
      slideCount: 10, href: './lessons/cse2120/data-classes/',
    }, {
      id: 'multidimensional-lists', number: 6, title: 'Multidimensional Lists',
      description: 'Nested lists, rows and columns, multidimensional indexing and nested-loop traversal.',
      slideCount: 14, href: './lessons/cse2120/multidimensional-lists/',
    }, {
      id: 'parallel-lists', number: 7, title: 'Parallel Lists',
      description: 'Related lists, matching indices, enumerate and zip traversal.',
      slideCount: 7, href: './lessons/cse2120/parallel-lists/',
    }]),
  moduleEntry('CSE 2130', 'Files & File Structures 1',
    'Store and retrieve program data using files.',
    ['File organization', 'Reading and writing files', 'Sequential and random access'], [{
      id: 'reading-writing-appending', number: 1, title: 'Reading, Writing, and Appending',
      description: 'Text file modes, reading lines, writing, appending and the read-process-write cycle.',
      slideCount: 16, href: './lessons/cse2130/reading-writing-appending/',
    }]),
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
