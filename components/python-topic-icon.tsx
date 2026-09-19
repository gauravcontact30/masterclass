import { createElement } from "react";
import {
  AlertTriangle, ArrowDownUp, Asterisk, Binary, Blocks, Bug, Braces, Brackets, CalendarClock, ChartLine,
  CircleSlash, Code2, Copy, Cpu, Equal, FileCode2, FileJson, FileSpreadsheet, FileText, Folder,
  FunctionSquare, GitFork, Hash, Infinity as InfinityIcon, KeyRound, Layers, LayoutGrid, ListOrdered,
  Lock, Maximize, Package, PackageOpen, Regex, Repeat, Repeat2, Rows3, Scissors, Shapes, Shield,
  ShieldCheck, Sigma, SkipForward, Split, Table, Tag, Terminal, TestTube, ToggleLeft, Type,
  Variable, Workflow, Zap, type LucideIcon,
} from "lucide-react";

/**
 * A mark for a Python topic.
 *
 * Same arrangement as the other two catalogues: the category supplies a
 * default and most topics override it, because a handbook card is read one at
 * a time and the mark has to separate "Lists" from "Tuples" rather than just
 * label the group they share.
 */
const BY_CATEGORY: Record<string, LucideIcon> = {
  "Language basics": Code2,
  "Collections": Blocks,
  "Control flow": GitFork,
  "Functions": FunctionSquare,
  "Objects & classes": Shapes,
  "Errors & testing": Bug,
  "Files & data": Folder,
  "Typing": Type,
  "Async & concurrency": Zap,
  "Modules & packaging": Package,
  "Standard library": Layers,
  "Data & scientific": ChartLine,
};

const BY_TOPIC: Record<string, LucideIcon> = {
  // Language basics
  "Variables & assignment": Variable,
  "Numbers": Binary,
  "Strings": Type,
  "Booleans & truthiness": ToggleLeft,
  "None": CircleSlash,
  "Operators": Equal,
  "Input & output": Terminal,
  // Collections
  "Lists": ListOrdered,
  "Tuples": Lock,
  "Dictionaries": Braces,
  "Sets": Shapes,
  "Slicing": Scissors,
  "Comprehensions": Brackets,
  "Iterators & iterables": Repeat,
  // Control flow
  "if / elif / else": GitFork,
  "for loops": Repeat,
  "while loops": Repeat2,
  "break, continue & else": SkipForward,
  "match statements": Split,
  // Functions
  "Functions": FunctionSquare,
  "Arguments & defaults": Tag,
  "*args & **kwargs": Asterisk,
  "Lambda": Sigma,
  "Scope & closures": Maximize,
  "Decorators": Copy,
  "Generators": InfinityIcon,
  "Recursion": ArrowDownUp,
  // Objects and classes
  "Classes & instances": Blocks,
  "Inheritance & MRO": GitFork,
  "Dunder methods": Hash,
  "Dataclasses": Rows3,
  "Properties": KeyRound,
  "Class & static methods": LayoutGrid,
  // Errors and testing
  "Exceptions": AlertTriangle,
  "try / except / finally": Shield,
  "Custom exceptions": ShieldCheck,
  "pytest": TestTube,
  "Debugging": Bug,
  // Files and data
  "File I/O": FileText,
  "Context managers": Lock,
  "pathlib": Folder,
  "JSON": FileJson,
  "CSV": FileSpreadsheet,
  // Typing
  "Type hints": Type,
  "mypy": ShieldCheck,
  "Generics & Protocols": Shapes,
  // Async and concurrency
  "async / await": Zap,
  "asyncio": Workflow,
  "Threads & the GIL": Lock,
  "Multiprocessing": Cpu,
  // Modules and packaging
  "Modules & imports": FileCode2,
  "Virtual environments": PackageOpen,
  "pip & dependencies": Package,
  "pyproject.toml": FileCode2,
  // Standard library
  "collections": Blocks,
  "itertools": Repeat,
  "datetime": CalendarClock,
  "re": Regex,
  // Data and scientific
  "NumPy": Table,
  "pandas": Table,
  "matplotlib": ChartLine,
  "Jupyter": FileCode2,
};

export function pythonTopicIcon(name: string, category: string): LucideIcon {
  return BY_TOPIC[name] ?? BY_CATEGORY[category] ?? Code2;
}

export function pythonCategoryIcon(category: string): LucideIcon {
  return BY_CATEGORY[category] ?? Layers;
}

/** `createElement` rather than `<Icon />`: see aws-service-icon.tsx. */
export function PythonTopicIcon({ name, category, size = 15, className }: {
  name: string; category: string; size?: number; className?: string;
}) {
  return createElement(pythonTopicIcon(name, category), { size, className, "aria-hidden": true });
}

export function PythonCategoryIcon({ category, size = 14, className }: { category: string; size?: number; className?: string }) {
  return createElement(pythonCategoryIcon(category), { size, className, "aria-hidden": true });
}
