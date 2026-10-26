// Skulpt does not implement annotation-only class fields or Python's dataclasses
// module. Preserve source line numbers while lowering those fields to annotations.
// This compatibility module supports the introductory, mutable dataclass features
// used in these lessons; it is not a replacement for CPython's full dataclasses API.
function prepareClassAnnotations(code) {
  const classes = [];
  // Ignore strings/comments when recognizing declarations, including apparent
  // class definitions inside multiline documentation or editable sample text.
  const visibleLines = code.replace(/("""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|#[^\n]*)/g,
    text => text.replace(/[^\n]/g, ' ')).split('\n');
  return code.split('\n').map((line, index) => {
    const visible = visibleLines[index];
    const indent = line.match(/^ */)[0].length;
    if (visible.trim()) {
      while (classes.length && indent <= classes.at(-1).indent) classes.pop();
    }
    if (/^\s*class\s+\w+.*:\s*$/.test(visible)) {
      classes.push({ indent, fieldsIndent: null, initialized: false });
      return line;
    }
    const owner = classes.at(-1);
    if (!owner || !visible.trim()) return line;
    owner.fieldsIndent ??= indent;
    if (indent !== owner.fieldsIndent) return line;
    const field = line.match(/^( *)([A-Za-z_]\w*)\s*:\s*([A-Za-z_]\w*(?:\[[^\]]+\])?)(?:\s*=\s*(.+?))?\s*(?:#.*)?$/);
    if (!field) return line;
    const [, spaces, name, annotation, value] = field;
    const assignment = owner.initialized
      ? `__annotations__[${JSON.stringify(name)}] = ${annotation}`
      : `__annotations__ = {${JSON.stringify(name)}: ${annotation}}`;
    owner.initialized = true;
    return spaces + assignment + (value === undefined ? '' : `; ${name} = ${value}`);
  }).join('\n');
}

const dataclassesModule = `
def dataclass(cls=None):
    if cls is None:
        return dataclass
    fields = list(getattr(cls, '__annotations__', {}))
    defaults = {name: getattr(cls, name) for name in fields if hasattr(cls, name)}
    seen_default = False
    for name in fields:
        if name in defaults:
            seen_default = True
        elif seen_default:
            raise TypeError("non-default argument '" + name + "' follows default argument")

    def __init__(self, *args, **kwargs):
        if len(args) > len(fields):
            raise TypeError('Too many positional arguments')
        for name in kwargs:
            if name not in fields:
                raise TypeError("Unexpected keyword argument '" + name + "'")
        for i, name in enumerate(fields):
            if i < len(args):
                if name in kwargs:
                    raise TypeError("Multiple values for argument '" + name + "'")
                value = args[i]
            elif name in kwargs:
                value = kwargs[name]
            elif name in defaults:
                value = defaults[name]
            else:
                raise TypeError("Missing required argument '" + name + "'")
            setattr(self, name, value)

    def __repr__(self):
        return cls.__name__ + '(' + ', '.join(name + '=' + repr(getattr(self, name)) for name in fields) + ')'

    def __eq__(self, other):
        if type(self) is not type(other):
            return NotImplemented
        return all(getattr(self, name) == getattr(other, name) for name in fields)

    if '__init__' not in cls.__dict__:
        cls.__init__ = __init__
    if '__repr__' not in cls.__dict__:
        cls.__repr__ = __repr__
    if '__eq__' not in cls.__dict__:
        cls.__eq__ = __eq__
        cls.__hash__ = None
    cls.__dataclass_fields__ = fields
    return cls
`;
