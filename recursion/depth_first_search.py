import py5

# 0 = open, 1 = wall; coordinates are (row, column).
MAZE = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
]
START = (1, 1)
END = (4, 5)
DIRECTIONS = [(-1, 0, "UP"), (1, 0, "DOWN"), (0, 1, "RIGHT"), (0, -1, "LEFT")]

# Virtual 16:9 canvas; fullscreen uses the display's native resolution.
WIDTH, HEIGHT = 1920, 1080
# Keep drawing coordinates in the original layout and scale the whole scene.
LAYOUT_WIDTH, LAYOUT_HEIGHT = 1450, 940
LAYOUT_SCALE = min(WIDTH / LAYOUT_WIDTH, HEIGHT / LAYOUT_HEIGHT)
LAYOUT_OFFSET_X = (WIDTH - LAYOUT_WIDTH * LAYOUT_SCALE) / 2
LAYOUT_OFFSET_Y = (HEIGHT - LAYOUT_HEIGHT * LAYOUT_SCALE) / 2
CELL = 79
GRID_X, GRID_Y = 55, 155
FLOW_X, FLOW_Y = 700, 110
FLOW_W, FLOW_H = 715, 700

BACKGROUND = "#101628"
PANEL = "#1b2540"
WALL = "#101b44"
OPEN = "#d9dfeb"
VISITED = "#4d93d7"
FAILED = "#e2a04c"
PATH = "#53c996"
FOCUS = "#fff0a0"
TEXT = "#f7f9ff"
MUTED = "#adbbd5"
NODE_FILL = "#263451"
NODE_ACTIVE = "#695626"
NODE_STROKE = "#485777"
NODE_STROKE_ACTIVE = "#ffd96a"

STEPS = []
step_index = 0
playing = False
looping = False
playback_fps = 1.0
last_step_ms = 0
visited = set()
failed = set()
solution = set()
stack = []
mouse = START

# The two columns follow solve.png: descend through the base cases, then
# climb through the remaining recursive calls. Coordinates are panel-local.
FLOW_NODES = {
    "CALL": {"type": "io", "x": 210, "y": 65, "w": 110, "h": 38, "label": "PARAM\ncurrent"},
    "BOUNDS": {"type": "decision", "x": 210, "y": 130, "w": 125, "h": 58, "label": "current in\nbounds?"},
    "WALL": {"type": "decision", "x": 210, "y": 220, "w": 125, "h": 58, "label": "current is\nwall?"},
    "VISITED": {"type": "decision", "x": 210, "y": 310, "w": 125, "h": 58, "label": "current is\nvisited?"},
    "EXIT": {"type": "decision", "x": 210, "y": 400, "w": 125, "h": 58, "label": "current is\nexit?"},
    "MARK": {"type": "process", "x": 210, "y": 480, "w": 200, "h": 50, "label": "mark current as visited\nrow = current[0]\ncol = current[1]"},
    "UP": {"type": "subroutine", "x": 210, "y": 550, "w": 195, "h": 40, "label": "check_up =\nsolve(row - 1, col)"},
    "CHECK_UP": {"type": "decision", "x": 210, "y": 625, "w": 125, "h": 62, "label": "check_up is\nTrue?"},
    "DOWN": {"type": "subroutine", "x": 475, "y": 625, "w": 195, "h": 40, "label": "check_down =\nsolve(row + 1, col)"},
    "CHECK_DOWN": {"type": "decision", "x": 475, "y": 545, "w": 125, "h": 62, "label": "check_down\nis True?"},
    "RIGHT": {"type": "subroutine", "x": 475, "y": 455, "w": 195, "h": 40, "label": "check_right =\nsolve(row, col + 1)"},
    "CHECK_RIGHT": {"type": "decision", "x": 475, "y": 375, "w": 125, "h": 62, "label": "check_right\nis True?"},
    "LEFT": {"type": "subroutine", "x": 475, "y": 285, "w": 195, "h": 40, "label": "check_left =\nsolve(row, col - 1)"},
    "CHECK_LEFT": {"type": "decision", "x": 475, "y": 205, "w": 125, "h": 62, "label": "check_left\nis True?"},
}
for key, x, y, value in [
    ("FALSE_BOUNDS", 65, 130, False), ("FALSE_WALL", 65, 220, False),
    ("FALSE_VISITED", 65, 310, False), ("TRUE_EXIT", 65, 400, True),
    ("TRUE_UP", 65, 625, True), ("TRUE_DOWN", 635, 545, True),
    ("TRUE_RIGHT", 635, 375, True), ("TRUE_LEFT", 635, 205, True),
    ("FALSE_END", 475, 115, False),
]:
    FLOW_NODES[key] = {"type": "io", "x": x, "y": y, "w": 100, "h": 38,
                       "label": "RETURN\n" + str(value)}


def record(node, message, candidate=None, returning=None):
    STEPS.append({
        "node": node,
        "message": message,
        "visited": frozenset(visited),
        "failed": frozenset(failed),
        "solution": frozenset(solution),
        "stack": tuple(stack),
        "mouse": mouse,
        "candidate": candidate,
        "returning": returning,
    })


def solve(row, col):
    global mouse
    position = (row, col)
    stack.append(position)
    record("CALL", f"Call solve({row}, {col})", candidate=position)

    record("BOUNDS", "Check whether the position is inside the maze.", candidate=position)
    if not (0 <= row < len(MAZE) and 0 <= col < len(MAZE[0])):
        record("FALSE_BOUNDS", "Outside maze: return False.", candidate=position, returning=False)
        stack.pop()
        return False

    record("WALL", "Check whether the cell is a wall.", candidate=position)
    if MAZE[row][col] == 1:
        record("FALSE_WALL", "Wall: return False.", candidate=position, returning=False)
        stack.pop()
        return False

    record("VISITED", "Check whether this cell was already visited.", candidate=position)
    if position in visited:
        record("FALSE_VISITED", "Already visited: return False.", candidate=position, returning=False)
        stack.pop()
        return False

    mouse = position
    record("EXIT", "Check whether this is the exit.", candidate=position)
    if position == END:
        solution.add(position)
        record("TRUE_EXIT", "Exit found: return True.", returning=True)
        stack.pop()
        return True

    visited.add(position)
    record("MARK", "Mark this cell as visited.")

    for dr, dc, direction in DIRECTIONS:
        next_position = (row + dr, col + dc)
        record(direction, f"Try {direction}: solve{next_position}.", candidate=next_position)
        found = solve(*next_position)
        mouse = position
        record("CHECK_" + direction, f"{direction} returned {found}.", returning=found)
        if found:
            mouse = position
            solution.add(position)
            record("TRUE_" + direction, f"{direction} returned True. Pass True to the caller.", returning=True)
            stack.pop()
            return True
        mouse = position
        record("CHECK_" + direction, f"{direction} returned False. Try the next direction.", candidate=next_position, returning=False)

    failed.add(position)
    record("FALSE_END", "All four directions failed. Return False and backtrack.", returning=False)
    stack.pop()
    return False


def build_steps():
    global mouse
    visited.clear()
    failed.clear()
    solution.clear()
    stack.clear()
    STEPS.clear()
    mouse = START
    record("CALL", "Press RIGHT to begin exploring the maze.")
    solve(*START)
    record("TRUE_UP" if END in solution else "FALSE_END", "Search finished.")


def settings():
    py5.full_screen()
    py5.smooth()


def setup():
    py5.text_font(py5.create_font("Arial", 18))
    build_steps()


def draw_panel(x, y, w, h):
    py5.no_stroke()
    py5.fill(PANEL)
    py5.rect(x, y, w, h, 15)


def draw_maze(state):
    draw_panel(35, 110, 630, 555)
    py5.fill(TEXT)
    py5.text_size(23)
    py5.text_align(py5.LEFT, py5.BASELINE)
    py5.text("MAZE", GRID_X, 143)

    for row in range(len(MAZE)):
        for col in range(len(MAZE[row])):
            position = (row, col)
            x = GRID_X + col * CELL
            y = GRID_Y + row * CELL
            color = WALL if MAZE[row][col] else OPEN
            if position in state["visited"]:
                color = VISITED
            if position in state["failed"]:
                color = FAILED
            if position in state["solution"]:
                color = PATH
            py5.fill(color)
            py5.stroke(BACKGROUND)
            py5.stroke_weight(3)
            py5.rect(x, y, CELL - 3, CELL - 3, 9)

    for position, label, color in [(START, "START", "#245e3f"), (END, "END", "#8d302a")]:
        row, col = position
        x = GRID_X + col * CELL + CELL / 2
        y = GRID_Y + row * CELL + CELL / 2
        py5.fill(color)
        py5.no_stroke()
        py5.rect(x - 32, y - 13, 64, 26, 6)
        py5.fill(TEXT)
        py5.text_align(py5.CENTER, py5.CENTER)
        py5.text_size(15)
        py5.text(label, x, y)

    candidate = state["candidate"]
    if candidate is not None and 0 <= candidate[0] < len(MAZE) and 0 <= candidate[1] < len(MAZE[0]):
        row, col = candidate
        x = GRID_X + col * CELL
        y = GRID_Y + row * CELL
        py5.no_fill()
        py5.stroke(FOCUS)
        py5.stroke_weight(5)
        py5.rect(x + 4, y + 4, CELL - 11, CELL - 11, 8)

    row, col = state["mouse"]
    cx = GRID_X + col * CELL + CELL / 2
    cy = GRID_Y + row * CELL + CELL / 2
    py5.no_stroke()
    py5.fill("#f4e7e2")
    py5.circle(cx - 18, cy - 17, 23)
    py5.circle(cx + 18, cy - 17, 23)
    py5.fill("#9d7b8a")
    py5.circle(cx - 18, cy - 17, 12)
    py5.circle(cx + 18, cy - 17, 12)
    py5.fill("#eeeeee")
    py5.ellipse(cx, cy + 2, 51, 45)
    py5.fill("#212b44")
    py5.circle(cx - 9, cy, 6)
    py5.circle(cx + 9, cy, 6)
    py5.fill("#dc8090")
    py5.circle(cx, cy + 11, 9)


def node_style(active):
    stroke = NODE_STROKE_ACTIVE if active else NODE_STROKE
    fill = NODE_ACTIVE if active else NODE_FILL
    text = "#fff4c9" if active else TEXT
    return stroke, fill, text


def draw_process(cx, cy, w, h, label, active=False, text_size=15):
    stroke, fill, text_color = node_style(active)
    py5.stroke(stroke)
    py5.stroke_weight(3 if active else 1.5)
    py5.fill(fill)
    py5.rect(cx - w / 2, cy - h / 2, w, h, 8)
    py5.no_stroke()
    py5.fill(text_color)
    py5.text_align(py5.CENTER, py5.CENTER)
    py5.text_size(text_size)
    py5.text(label, cx, cy)


def draw_terminator(cx, cy, w, h, label, active=False, text_size=15):
    stroke, fill, text_color = node_style(active)
    py5.stroke(stroke)
    py5.stroke_weight(3 if active else 1.5)
    py5.fill(fill)
    py5.rect(cx - w / 2, cy - h / 2, w, h, h / 2)
    py5.no_stroke()
    py5.fill(text_color)
    py5.text_align(py5.CENTER, py5.CENTER)
    py5.text_size(text_size)
    py5.text(label, cx, cy)


def draw_decision(cx, cy, w, h, label, active=False, text_size=15):
    stroke, fill, text_color = node_style(active)
    py5.stroke(stroke)
    py5.stroke_weight(3 if active else 1.5)
    py5.fill(fill)
    py5.begin_shape()
    py5.vertex(cx, cy - h / 2)
    py5.vertex(cx + w / 2, cy)
    py5.vertex(cx, cy + h / 2)
    py5.vertex(cx - w / 2, cy)
    py5.end_shape(py5.CLOSE)
    py5.no_stroke()
    py5.fill(text_color)
    py5.text_align(py5.CENTER, py5.CENTER)
    py5.text_size(text_size)
    py5.text(label, cx, cy)


def draw_arrow(x1, y1, x2, y2, label=None, lx=None, ly=None, color="#7081a8", weight=2):
    py5.stroke(color)
    py5.stroke_weight(weight)
    py5.line(x1, y1, x2, y2)

    angle = py5.atan2(y2 - y1, x2 - x1)
    arrow_size = 10
    py5.line(x2, y2, x2 - arrow_size * py5.cos(angle - 0.45), y2 - arrow_size * py5.sin(angle - 0.45))
    py5.line(x2, y2, x2 - arrow_size * py5.cos(angle + 0.45), y2 - arrow_size * py5.sin(angle + 0.45))

    if label is not None:
        py5.no_stroke()
        py5.fill(MUTED)
        py5.text_size(13)
        py5.text_align(py5.CENTER, py5.CENTER)
        py5.text(label, lx if lx is not None else (x1 + x2) / 2, ly if ly is not None else (y1 + y2) / 2)


def draw_io(cx, cy, w, h, label, active=False, text_size=13):
    stroke, fill, text_color = node_style(active)
    py5.stroke(stroke)
    py5.stroke_weight(3 if active else 1.5)
    py5.fill(fill)
    py5.begin_shape()
    for x, y in [(cx - w / 2 + 12, cy - h / 2), (cx + w / 2, cy - h / 2),
                 (cx + w / 2 - 12, cy + h / 2), (cx - w / 2, cy + h / 2)]:
        py5.vertex(x, y)
    py5.end_shape(py5.CLOSE)
    py5.fill(text_color)
    py5.text_align(py5.CENTER, py5.CENTER)
    py5.text_size(text_size)
    py5.text(label, cx, cy)


def draw_flow_connectors():
    def connect(source, target, label=None, horizontal=False):
        a, b = FLOW_NODES[source], FLOW_NODES[target]
        if horizontal:
            sign = 1 if b["x"] > a["x"] else -1
            x1, y1 = a["x"] + sign * a["w"] / 2, a["y"]
            x2, y2 = b["x"] - sign * b["w"] / 2, b["y"]
            draw_arrow(x1, y1, x2, y2, label, (x1 + x2) / 2, y1 - 10)
        else:
            sign = 1 if b["y"] > a["y"] else -1
            x = a["x"]
            y1, y2 = a["y"] + sign * a["h"] / 2, b["y"] - sign * b["h"] / 2
            draw_arrow(x, y1, x, y2, label, x + 14, (y1 + y2) / 2)

    for source, target, label in [
        ("CALL", "BOUNDS", None), ("BOUNDS", "WALL", "T"),
        ("WALL", "VISITED", "F"), ("VISITED", "EXIT", "F"),
        ("EXIT", "MARK", "F"), ("MARK", "UP", None),
        ("UP", "CHECK_UP", None), ("DOWN", "CHECK_DOWN", None),
        ("CHECK_DOWN", "RIGHT", "F"), ("RIGHT", "CHECK_RIGHT", None),
        ("CHECK_RIGHT", "LEFT", "F"), ("LEFT", "CHECK_LEFT", None),
        ("CHECK_LEFT", "FALSE_END", "F"),
    ]:
        connect(source, target, label)
    for source, target, label in [
        ("BOUNDS", "FALSE_BOUNDS", "F"), ("WALL", "FALSE_WALL", "T"),
        ("VISITED", "FALSE_VISITED", "T"), ("EXIT", "TRUE_EXIT", "T"),
        ("CHECK_UP", "TRUE_UP", "T"), ("CHECK_UP", "DOWN", "F"),
        ("CHECK_DOWN", "TRUE_DOWN", "T"), ("CHECK_RIGHT", "TRUE_RIGHT", "T"),
        ("CHECK_LEFT", "TRUE_LEFT", "T"),
    ]:
        connect(source, target, label, horizontal=True)


def draw_flowchart(state):
    draw_panel(FLOW_X, FLOW_Y, FLOW_W, FLOW_H)
    py5.push_matrix()
    py5.translate(FLOW_X, FLOW_Y)
    py5.fill(TEXT)
    py5.text_align(py5.CENTER, py5.CENTER)
    py5.text_size(17)
    py5.text("solve(current)", 210, 27)
    draw_flow_connectors()
    for key, meta in FLOW_NODES.items():
        active = key == state["node"]
        args = (meta["x"], meta["y"], meta["w"], meta["h"], meta["label"], active, 13)
        if meta["type"] == "io":
            draw_io(*args)
        elif meta["type"] == "decision":
            draw_decision(*args)
        else:
            draw_process(*args)
            if meta["type"] == "subroutine":
                py5.stroke(NODE_STROKE_ACTIVE if active else NODE_STROKE)
                py5.stroke_weight(1.5)
                for x in (meta["x"] - meta["w"] / 2 + 18, meta["x"] + meta["w"] / 2 - 18):
                    py5.line(x, meta["y"] - meta["h"] / 2, x, meta["y"] + meta["h"] / 2)
    py5.pop_matrix()


def draw_status(state):
    py5.fill(TEXT)
    py5.text_align(py5.LEFT, py5.BASELINE)
    py5.text_size(30)
    py5.text("DEPTH FIRST SEARCH - STEP THROUGH", 46, 56)
    py5.fill(MUTED)
    py5.text_size(16)
    py5.text("SPACE: play/pause   L: loop   F: 10 steps/s   S: 0.25 steps/s   N: 1 step/s   LEFT/RIGHT: step   R: reset   ESC: exit", 46, 85)
    py5.text_align(py5.RIGHT, py5.BASELINE)
    py5.text(f"{'PLAYING' if playing else 'PAUSED'}   |   {playback_fps:g} steps/s   |   Loop: {'ON' if looping else 'OFF'}", 1395, 56)

    draw_panel(35, 835, 1380, 75)
    py5.fill(TEXT)
    py5.text_size(18)
    py5.text_align(py5.LEFT, py5.BASELINE)
    py5.text(state["message"], 55, 866)
    py5.fill(MUTED)
    py5.text_size(16)
    py5.text(
        f"Step {step_index + 1} / {len(STEPS)}    |    Recursion depth: {len(state['stack'])}    |    Visited: {len(state['visited'])}",
        55,
        893,
    )
    if state["returning"] is not None:
        py5.fill(PATH if state["returning"] else FAILED)
        py5.text_align(py5.RIGHT, py5.BASELINE)
        py5.text_size(22)
        py5.text("RETURN TRUE" if state["returning"] else "RETURN FALSE", 1385, 893)


def update_playback():
    global step_index, playing, last_step_ms
    if not playing:
        return
    now = py5.millis()
    if now - last_step_ms < 1000 / playback_fps:
        return
    last_step_ms = now
    if step_index < len(STEPS) - 1:
        step_index += 1
        if step_index == len(STEPS) - 1 and not looping:
            playing = False
    elif looping:
        step_index = 0
    else:
        playing = False


def draw():
    update_playback()
    py5.background(BACKGROUND)
    py5.push_matrix()
    # Fit the virtual canvas without stretching on other display ratios.
    screen_scale = min(py5.width / WIDTH, py5.height / HEIGHT)
    py5.translate((py5.width - WIDTH * screen_scale) / 2,
                  (py5.height - HEIGHT * screen_scale) / 2)
    py5.scale(screen_scale)
    py5.translate(LAYOUT_OFFSET_X, LAYOUT_OFFSET_Y)
    py5.scale(LAYOUT_SCALE)
    state = STEPS[step_index]
    draw_maze(state)
    draw_flowchart(state)
    draw_status(state)
    py5.pop_matrix()


def key_pressed():
    global step_index, playing, looping, playback_fps, last_step_ms
    if py5.key == py5.ESC:
        py5.exit_sketch()
        return
    if py5.key == py5.CODED:
        if py5.key_code == py5.RIGHT:
            step_index = min(step_index + 1, len(STEPS) - 1)
        elif py5.key_code == py5.LEFT:
            step_index = max(step_index - 1, 0)
        else:
            return
        playing = False
        last_step_ms = py5.millis()
    elif py5.key == " ":
        playing = not playing
        if playing and step_index == len(STEPS) - 1:
            step_index = 0
        last_step_ms = py5.millis()
    elif py5.key in ("l", "L"):
        looping = not looping
    elif py5.key in ("f", "F", "s", "S", "n", "N"):
        playback_fps = {"f": 10.0, "s": 0.25, "n": 1.0}[str(py5.key).lower()]
        playing = True
        if step_index == len(STEPS) - 1:
            step_index = 0
        last_step_ms = py5.millis()
    elif py5.key in ("r", "R"):
        step_index = 0
        last_step_ms = py5.millis()


if __name__ == "__main__":
    py5.run_sketch()
