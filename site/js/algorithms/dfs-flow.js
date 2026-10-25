export const nodes = {
  "CALL": {
    "type": "io",
    "x": 210,
    "y": 65,
    "w": 110,
    "h": 38,
    "label": "PARAM\ncurrent",
    "role": "parameter"
  },
  "BOUNDS": {
    "type": "decision",
    "x": 210,
    "y": 130,
    "w": 125,
    "h": 58,
    "label": "current in\nbounds?",
    "role": "decision"
  },
  "WALL": {
    "type": "decision",
    "x": 210,
    "y": 220,
    "w": 125,
    "h": 58,
    "label": "current is\nwall?",
    "role": "decision"
  },
  "VISITED": {
    "type": "decision",
    "x": 210,
    "y": 310,
    "w": 125,
    "h": 58,
    "label": "current is\nvisited?",
    "role": "decision"
  },
  "EXIT": {
    "type": "decision",
    "x": 210,
    "y": 400,
    "w": 125,
    "h": 58,
    "label": "current is\nexit?",
    "role": "decision"
  },
  "MARK": {
    "type": "process",
    "x": 210,
    "y": 480,
    "w": 200,
    "h": 50,
    "label": "mark current as visited\nrow = current[0]\ncol = current[1]",
    "role": "process"
  },
  "UP": {
    "type": "subroutine",
    "x": 210,
    "y": 550,
    "w": 195,
    "h": 40,
    "label": "check_up =\nsolve(row - 1, col)",
    "role": "predefined"
  },
  "CHECK_UP": {
    "type": "decision",
    "x": 210,
    "y": 625,
    "w": 125,
    "h": 62,
    "label": "check_up is\nTrue?",
    "role": "decision"
  },
  "DOWN": {
    "type": "subroutine",
    "x": 475,
    "y": 625,
    "w": 195,
    "h": 40,
    "label": "check_down =\nsolve(row + 1, col)",
    "role": "predefined"
  },
  "CHECK_DOWN": {
    "type": "decision",
    "x": 475,
    "y": 545,
    "w": 125,
    "h": 62,
    "label": "check_down\nis True?",
    "role": "decision"
  },
  "RIGHT": {
    "type": "subroutine",
    "x": 475,
    "y": 455,
    "w": 195,
    "h": 40,
    "label": "check_right =\nsolve(row, col + 1)",
    "role": "predefined"
  },
  "CHECK_RIGHT": {
    "type": "decision",
    "x": 475,
    "y": 375,
    "w": 125,
    "h": 62,
    "label": "check_right\nis True?",
    "role": "decision"
  },
  "LEFT": {
    "type": "subroutine",
    "x": 475,
    "y": 285,
    "w": 195,
    "h": 40,
    "label": "check_left =\nsolve(row, col - 1)",
    "role": "predefined"
  },
  "CHECK_LEFT": {
    "type": "decision",
    "x": 475,
    "y": 205,
    "w": 125,
    "h": 62,
    "label": "check_left\nis True?",
    "role": "decision"
  },
  "FALSE_BOUNDS": {
    "type": "io",
    "x": 65,
    "y": 130,
    "w": 100,
    "h": 38,
    "label": "RETURN\nFalse",
    "role": "return"
  },
  "FALSE_WALL": {
    "type": "io",
    "x": 65,
    "y": 220,
    "w": 100,
    "h": 38,
    "label": "RETURN\nFalse",
    "role": "return"
  },
  "FALSE_VISITED": {
    "type": "io",
    "x": 65,
    "y": 310,
    "w": 100,
    "h": 38,
    "label": "RETURN\nFalse",
    "role": "return"
  },
  "TRUE_EXIT": {
    "type": "io",
    "x": 65,
    "y": 400,
    "w": 100,
    "h": 38,
    "label": "RETURN\nTrue",
    "role": "return"
  },
  "TRUE_UP": {
    "type": "io",
    "x": 65,
    "y": 625,
    "w": 100,
    "h": 38,
    "label": "RETURN\nTrue",
    "role": "return"
  },
  "TRUE_DOWN": {
    "type": "io",
    "x": 635,
    "y": 545,
    "w": 100,
    "h": 38,
    "label": "RETURN\nTrue",
    "role": "return"
  },
  "TRUE_RIGHT": {
    "type": "io",
    "x": 635,
    "y": 375,
    "w": 100,
    "h": 38,
    "label": "RETURN\nTrue",
    "role": "return"
  },
  "TRUE_LEFT": {
    "type": "io",
    "x": 635,
    "y": 205,
    "w": 100,
    "h": 38,
    "label": "RETURN\nTrue",
    "role": "return"
  },
  "FALSE_END": {
    "type": "io",
    "x": 475,
    "y": 115,
    "w": 100,
    "h": 38,
    "label": "RETURN\nFalse",
    "role": "return"
  }
};
