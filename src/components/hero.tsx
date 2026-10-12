"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Focus,
  Layers3,
  Minus,
  MousePointer2,
  Move,
  Pencil,
  Play,
  Leaf,
  Plus,
  Redo2,
  RotateCcw,
  Undo2,
  X,
} from "lucide-react";
import {
  FINISHES,
  INITIAL_SELECTION,
  STORAGE_KEY,
  bounds,
  commitStudy,
  createStudy,
  editLevel,
  moveWall,
  parseSavedStudy,
  polygonArea,
  redoStudy,
  resizeLevel,
  selectedLevel,
  undoStudy,
  type Finish,
  type LevelMode,
  type Selection,
  type StudyHistory,
  type StudyModel,
} from "@/lib/spatial/editor-model";
import { PRITHVIKA_BLOCKS, thesisSheet } from "@/lib/spatial/prithvika-content";
import { STORY_STOPS, storyPose } from "@/lib/spatial/story-motion";
import type { StudySceneState } from "@/lib/spatial/study-scene";

const CHAPTERS = [
  {
    name: "Landscape",
    title: "A landscape.",
    accent: "Reimagined.",
    detail:
      "Prithvika begins with the land. A research campus rooted in the repair of a coal-mined landscape.",
  },
  {
    name: "Campus",
    title: "A campus.",
    accent: "Connected.",
    detail:
      "Curved research wings, open courtyards and a circular exhibition. Each part finds its place.",
  },
  {
    name: "Layers",
    title: "What if",
    accent: "you shaped it?",
    detail:
      "Look between the floors. Discover how the spaces come together, then explore your own ideas.",
  },
];
export function Hero() {
  const story = useRef<HTMLDivElement>(null);
  const [chapter, setChapter] = useState(0);
  const [labels, setLabels] = useState(true);
  const section = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null),
    editButton = useRef<HTMLButtonElement>(null);
  const [history, setHistory] = useState<StudyHistory>(() => ({
    past: [],
    present: createStudy(),
    future: [],
  }));
  const [draft, setDraft] = useState<StudyModel | null>(null);
  const [selection, setSelection] = useState<Selection>(INITIAL_SELECTION);
  const [editing, setEditing] = useState(false),
    [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false);
  const [mode, setMode] = useState<LevelMode>("stacked"),
    [view, setView] = useState<"perspective" | "plan">("perspective");
  const [orbit, setOrbit] = useState(true),
    [reduced, setReduced] = useState(false),
    [highResolution, setHighResolution] = useState(false);
  const [loaded, setLoaded] = useState(false),
    [saved, setSaved] = useState(false),
    [message, setMessage] = useState("");
  const [panel, setPanel] = useState<"structure" | "surface">("surface");
  const model = draft || history.present,
    level = selectedLevel(model, selection)!;
  const building = model.buildings.find((b) => b.id === selection.building)!;
  const dimensions = bounds(level.outline);
  const activeFinish =
    selection.kind === "wall"
      ? level.wallFinishes[selection.wall] || level.finish
      : level.slabFinish;
  const scene = useRef<StudySceneState>({
    progress: 0,
    labels: true,
    model: history.present,
    selection: INITIAL_SELECTION,
    editing: false,
    mode: "stacked",
    view: "perspective",
    reduced: false,
    orbit: true,
    highResolution: false,
    focus: 0,
    resetCamera: 0,
    zoom: 0,
  });
  scene.current.labels = labels;
  scene.current.model = model;
  scene.current.selection = selection;
  scene.current.editing = editing;
  scene.current.mode = mode;
  scene.current.view = view;
  scene.current.orbit = orbit;
  scene.current.reduced = reduced;
  scene.current.highResolution = highResolution;
  useEffect(() => {
    if (editing) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!story.current || !section.current) return;
      const rect = story.current.getBoundingClientRect();
      const distance = Math.max(1, rect.height - section.current.clientHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / distance));
      scene.current.progress = progress;
      setChapter(storyPose(progress).chapter);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    if (story.current) observer.observe(story.current);
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [editing]);
  function goToChapter(index: number) {
    if (!story.current || !section.current) return;
    const rect = story.current.getBoundingClientRect();
    window.scrollTo({
      top:
        window.scrollY +
        rect.top +
        STORY_STOPS[index] * (rect.height - section.current.clientHeight),
      behavior: reduced ? "instant" : "smooth",
    });
  }
  useEffect(() => {
    try {
      const restored = parseSavedStudy(localStorage.getItem(STORAGE_KEY));
      if (restored) setHistory({ past: [], present: restored, future: [] });
    } catch {
      /* Storage is optional. Editing still works. */
    }
    setLoaded(true);
    let disposed = false,
      cleanup = () => {};
    const media = matchMedia("(prefers-reduced-motion: reduce)"),
      preference = () => setReduced(media.matches);
    preference();
    media.addEventListener("change", preference);
    import("@/lib/spatial/study-scene")
      .then(({ createStudyScene }) => {
        if (!disposed && host.current) {
          try {
            cleanup = createStudyScene(host.current, scene.current, {
              ready: () => setReady(true),
              error: () => {
                setFailed(true);
                setReady(false);
              },
              select: setSelection,
              inspect: (selection) => {
                setSelection(selection);
                startEditing();
              },
              preview: setDraft,
              commit: (next) => {
                setHistory((h) => commitStudy(h, next));
                setDraft(null);
              },
              orbitStopped: () => setOrbit(false),
            });
          } catch {
            setFailed(true);
          }
        }
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
      cleanup();
      media.removeEventListener("change", preference);
    };
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.present));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [history.present, loaded]);
  useEffect(() => {
    if (!editing) return;
    const key = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "Escape") {
        setEditing(false);
        scene.current.resetCamera++;
        requestAnimationFrame(() => {
          story.current?.scrollIntoView({
            block: "start",
            behavior: "instant",
          });
          editButton.current?.focus({ preventScroll: true });
        });
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        setDraft(null);
        setHistory(e.shiftKey ? redoStudy : undoStudy);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [editing]);
  function commit(next: StudyModel, label = "Study updated") {
    if (next === model) {
      setMessage(
        "That change would cross another edge or courtyard. Try a smaller adjustment.",
      );
      return;
    }
    setHistory((h) => commitStudy(h, next));
    setDraft(null);
    setMessage(label);
  }
  function choose(s: Selection) {
    if (
      s.building !== selection.building ||
      (mode === "solo" && s.level !== selection.level)
    )
      scene.current.focus++;
    setSelection(s);
    setPanel("surface");
    setMessage("");
  }
  function startEditing() {
    requestAnimationFrame(() =>
      section.current?.scrollIntoView({ block: "start", behavior: "instant" }),
    );
    setEditing(true);
    setOrbit(false);
    setMode("exploded");
    scene.current.focus++;
    setMessage(
      "Select a floor to reshape it, or drag a wall. Your changes stay in this browser.",
    );
  }
  function closeEditor() {
    setEditing(false);
    setMode("stacked");
    setView("perspective");
    scene.current.resetCamera++;
    requestAnimationFrame(() => {
      story.current?.scrollIntoView({ block: "start", behavior: "instant" });
      editButton.current?.focus({ preventScroll: true });
    });
  }
  function finish(value: Finish) {
    if (value === activeFinish) return;
    commit(
      editLevel(model, selection, (l) => {
        if (selection.kind === "slab") l.slabFinish = value;
        else l.wallFinishes[selection.wall] = value;
      }),
      `${FINISHES.find((f) => f.id === value)!.name} applied`,
    );
  }
  function exportStudy() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            project: "Prithvika visitor study",
            description:
              "Schematic reconstruction, not construction drawings. One scene unit represents ten metres.",
            ...history.present,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "prithvika-my-study.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Your study file has been downloaded.");
  }
  return (
    <div
      ref={story}
      className={`campus-story ${editing || failed ? "campus-story-static" : ""}`}
    >
      <section
        ref={section}
        className={`design-study ${editing ? "study-editing" : ""} ${ready ? "study-ready" : ""}`}
        data-chapter={chapter + 1}
        aria-label="Prithvika interactive design study"
      >
        <div
          className="study-canvas"
          ref={host}
          role="group"
          aria-label="Three-dimensional Prithvika campus reconstructed from Soham's portfolio. Use Edit this model, then the labelled controls to change floors, walls and materials."
        />
        {(!ready || failed) && (
          <div className="study-fallback">
            <img
              src="/portfolio-hd/thesis/page-01-800.webp"
              srcSet="/portfolio-hd/thesis/page-01-800.webp 800w, /portfolio-hd/thesis/page-01-1600.webp 1600w"
              sizes="(max-width: 700px) 100vw, 55vw"
              decoding="async"
              alt="Original Prithvika campus rendering from Soham Khetan's thesis"
            />
            <p>
              {failed
                ? "3D editing is unavailable on this device."
                : "Opening the design study…"}{" "}
              <Link href="/work/prithvika">
                Explore the original project <ArrowUpRight size={14} />
              </Link>
            </p>
          </div>
        )}
        <div className="study-intro" hidden={editing}>
          <span className="study-eyebrow">
            <Leaf size={12} /> ECOLOGICAL REPAIR /{" "}
            {String(chapter + 1).padStart(2, "0")} OF 03
          </span>
          <div className="study-chapter-copy" key={chapter}>
            <h1>
              {CHAPTERS[chapter].title}
              <br />
              <em>{CHAPTERS[chapter].accent}</em>
            </h1>
            <p>{CHAPTERS[chapter].detail}</p>
          </div>
          <button
            ref={editButton}
            className="study-primary"
            onClick={startEditing}
            disabled={!ready || failed}
          >
            <Pencil size={17} /> Edit this model <ArrowUpRight size={17} />
          </button>
          <button
            className="study-film-link"
            onClick={() => window.dispatchEvent(new Event("prithvika:watch"))}
          >
            <Play size={13} /> Watch the sustainability story
          </button>
        </div>
        <div className="study-index" hidden={editing}>
          <span>PRITHVIKA / THESIS 2026</span>
          <span>CHANDRAPUR, INDIA</span>
        </div>
        <div className="study-project-note" hidden={editing}>
          <span className="study-small-label">FROM THE PORTFOLIO</span>
          <Link href="/work/prithvika">
            Land, learning.
            <br />
            <em>A new beginning.</em> <ArrowUpRight size={21} />
          </Link>
          <p>A research campus on reclaimed coal land.</p>
          <span className="study-disclosure">
            Schematic model based on the thesis site plan.
          </span>
        </div>
        {editing && (
          <>
            <div className="study-edit-title">
              <span className="study-small-label">
                PRITHVIKA / YOUR DESIGN STUDY
              </span>
              <span className="study-save">
                {saved ? <Check size={12} /> : <Pencil size={12} />}{" "}
                {saved
                  ? "Saved in this browser"
                  : "Changes stay in this session"}
              </span>
              <button onClick={closeEditor} className="study-close">
                <X size={16} />
                <span>Finish exploring</span>
              </button>
            </div>
            <div className="study-mobile-tabs">
              <button
                aria-pressed={panel === "structure"}
                onClick={() => setPanel("structure")}
              >
                <Layers3 size={15} /> Building & floor
              </button>
              <button
                aria-pressed={panel === "surface"}
                onClick={() => setPanel("surface")}
              >
                <Pencil size={15} /> Edit surface
              </button>
            </div>
            <aside
              className={`study-panel study-structure ${panel === "structure" ? "panel-active" : ""}`}
              aria-label="Campus buildings and floors"
            >
              <div className="study-panel-title">
                <Layers3 size={15} />
                <span>The campus</span>
                <span className="study-count">07</span>
              </div>
              <p className="study-panel-help">
                Choose a building, then a floor.
              </p>
              <div className="study-tree">
                {model.buildings.map((b) => (
                  <div key={b.id}>
                    <button
                      className="study-tree-building"
                      aria-expanded={b.id === selection.building}
                      onClick={() =>
                        choose({
                          building: b.id,
                          level: b.levels[0].id,
                          kind: "slab",
                          wall: 0,
                        })
                      }
                    >
                      {b.id === selection.building ? (
                        <ChevronDown size={13} />
                      ) : (
                        <ChevronRight size={13} />
                      )}
                      <Box size={13} />
                      <span>{b.name}</span>
                    </button>
                    {b.id === selection.building && (
                      <div className="study-tree-levels">
                        {b.levels.map((l) => (
                          <button
                            key={l.id}
                            aria-pressed={l.id === selection.level}
                            onClick={() =>
                              choose({
                                building: b.id,
                                level: l.id,
                                kind: "slab",
                                wall: 0,
                              })
                            }
                          >
                            <span className="study-level-icon" />
                            {l.name}
                            <span>{l.outline.length} walls</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                className="study-focus"
                onClick={() => {
                  scene.current.focus++;
                }}
              >
                <Focus size={14} /> Focus on selected floor
              </button>
              <div className="study-source-note">
                <span>YOUR COPY</span>
                <p>
                  Experiment freely. The original project stays as Soham
                  designed it.
                </p>
                <Link href="/work/prithvika">
                  View original drawings <ArrowUpRight size={12} />
                </Link>
              </div>
            </aside>
            <aside
              className={`study-panel study-inspector ${panel === "surface" ? "panel-active" : ""}`}
              aria-label="Edit selected surface"
            >
              <div className="study-panel-title">
                <MousePointer2 size={15} />
                <span>Selected surface</span>
              </div>
              <h2>
                {selection.kind === "slab"
                  ? level.name
                  : `Wall ${selection.wall + 1}`}
              </h2>
              <p className="study-panel-help">{building.name}</p>
              <p className="study-program">
                {
                  PRITHVIKA_BLOCKS[building.id].floors[
                    building.levels.findIndex((l) => l.id === level.id)
                  ]
                }
              </p>
              <a
                className="study-sheet-link"
                href={thesisSheet(PRITHVIKA_BLOCKS[building.id].sheet)}
                target="_blank"
                rel="noopener noreferrer"
              >
                View source sheet {PRITHVIKA_BLOCKS[building.id].sheet}{" "}
                <ArrowUpRight size={11} />
              </a>
              <label className="study-field">
                Surface
                <select
                  aria-label="Select floor or wall"
                  value={
                    selection.kind === "slab" ? "slab" : String(selection.wall)
                  }
                  onChange={(e) =>
                    choose({
                      ...selection,
                      kind: e.target.value === "slab" ? "slab" : "wall",
                      wall:
                        e.target.value === "slab" ? 0 : Number(e.target.value),
                    })
                  }
                >
                  <option value="slab">Floor outline</option>
                  {level.outline.map((_, i) => (
                    <option key={i} value={i}>
                      Wall {i + 1}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset className="study-finishes">
                <legend>Surface material</legend>
                <div>
                  {FINISHES.map((f) => (
                    <button
                      key={f.id}
                      aria-label={f.name}
                      title={f.name}
                      aria-pressed={activeFinish === f.id}
                      style={{ "--finish": f.color } as React.CSSProperties}
                      onClick={() => finish(f.id)}
                    >
                      {activeFinish === f.id && <Check size={15} />}
                    </button>
                  ))}
                </div>
                <span>{FINISHES.find((f) => f.id === activeFinish)?.name}</span>
              </fieldset>
              {selection.kind === "slab" ? (
                <div className="study-dimensions">
                  <Dimension
                    key={`${level.id}-width-${dimensions.width}`}
                    label="Width"
                    value={dimensions.width * 10}
                    min={10}
                    max={180}
                    onCommit={(v) =>
                      commit(resizeLevel(model, selection, "width", v / 10))
                    }
                  />
                  <Dimension
                    key={`${level.id}-depth-${dimensions.depth}`}
                    label="Depth"
                    value={dimensions.depth * 10}
                    min={10}
                    max={180}
                    onCommit={(v) =>
                      commit(resizeLevel(model, selection, "depth", v / 10))
                    }
                  />
                </div>
              ) : (
                <div className="study-wall-move">
                  <span>Move selected wall</span>
                  <div>
                    <button
                      aria-label="Move wall inward by half a metre"
                      onClick={() => commit(moveWall(model, selection, -0.05))}
                    >
                      <Minus size={15} />
                    </button>
                    <span>0.5 m</span>
                    <button
                      aria-label="Move wall outward by half a metre"
                      onClick={() => commit(moveWall(model, selection, 0.05))}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              )}
              <Dimension
                key={`${level.id}-height-${level.height}`}
                label="Floor height"
                value={level.height * 10}
                min={2.5}
                max={7.5}
                onCommit={(v) =>
                  commit(
                    editLevel(model, selection, (l) => {
                      l.height = v / 10;
                    }),
                  )
                }
              />
              <div className="study-area">
                <span>Floor area</span>
                <strong>
                  {Math.round(
                    (polygonArea(level.outline) -
                      level.holes.reduce((s, h) => s + polygonArea(h), 0)) *
                      100,
                  ).toLocaleString()}{" "}
                  <small>m²</small>
                </strong>
              </div>
              <p className="study-tip">
                <Move size={15} />
                {selection.kind === "slab"
                  ? level.outline.length <= 20
                    ? "Drag a copper corner to reshape this floor. Switch to Plan for a view from above."
                    : "Use Width and Depth to reshape this curved floor, or select an individual wall."
                  : "Drag the highlighted wall, or use the ± controls to move it."}
              </p>
              <p className="study-approximation">
                Approximate study dimensions. Not construction drawings.
              </p>
            </aside>
          </>
        )}
        {!editing && !failed && (
          <nav className="study-chapters" aria-label="Campus story">
            {CHAPTERS.map((item, i) => (
              <button
                key={item.name}
                aria-current={chapter === i ? "step" : undefined}
                onClick={() => goToChapter(i)}
                disabled={!ready}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                {item.name}
                <i aria-hidden="true" />
              </button>
            ))}
          </nav>
        )}
        <div
          className="study-view-controls"
          aria-label="Model view"
          hidden={failed || !editing}
        >
          <div className="study-view-group">
            {(["stacked", "exploded", "solo"] as LevelMode[])
              .filter((v) => editing || v !== "solo")
              .map((v) => (
                <button
                  key={v}
                  aria-pressed={mode === v}
                  disabled={!ready}
                  onClick={() => setMode(v)}
                >
                  {v === "stacked" ? <Box size={15} /> : <Layers3 size={15} />}
                  <span>
                    {v === "stacked"
                      ? "Together"
                      : v === "exploded"
                        ? "Separate floors"
                        : "Only this floor"}
                  </span>
                </button>
              ))}
          </div>
          <div className="study-view-group">
            <button
              aria-pressed={view === "perspective"}
              disabled={!ready}
              onClick={() => setView("perspective")}
            >
              3D
            </button>
            <button
              aria-pressed={view === "plan"}
              disabled={!ready}
              onClick={() => {
                setView("plan");
                setOrbit(false);
              }}
            >
              Plan
            </button>
          </div>
        </div>
        <div
          className="study-camera-tools"
          aria-label="Camera controls"
          hidden={failed || !editing}
        >
          <button
            aria-label="Zoom in"
            onClick={() => {
              scene.current.zoom++;
            }}
            disabled={!ready}
          >
            <Plus size={17} />
          </button>
          <button
            aria-label="Zoom out"
            onClick={() => {
              scene.current.zoom--;
            }}
            disabled={!ready}
          >
            <Minus size={17} />
          </button>
          <button
            aria-label="Fit campus in view"
            onClick={() => {
              scene.current.resetCamera++;
              setView("perspective");
            }}
            disabled={!ready}
          >
            <Focus size={17} />
          </button>
          <button
            className="study-4k"
            aria-label="Use 4K scene resolution"
            aria-pressed={highResolution}
            onClick={() => setHighResolution(!highResolution)}
            disabled={!ready}
          >
            4K
          </button>
        </div>
        {editing ? (
          <div className="study-edit-footer">
            <div className="study-history">
              <button
                aria-label="Undo change"
                title="Undo · ⌘Z / Ctrl Z"
                disabled={!history.past.length}
                onClick={() => {
                  setDraft(null);
                  setHistory(undoStudy);
                  setMessage("Change undone");
                }}
              >
                <Undo2 size={16} />
              </button>
              <button
                aria-label="Redo change"
                title="Redo · ⇧⌘Z / Ctrl Shift Z"
                disabled={!history.future.length}
                onClick={() => {
                  setDraft(null);
                  setHistory(redoStudy);
                  setMessage("Change restored");
                }}
              >
                <Redo2 size={16} />
              </button>
              <button
                onClick={() => {
                  setHistory((h) => commitStudy(h, createStudy()));
                  setDraft(null);
                  setMessage(
                    "Original campus restored. You can undo this reset.",
                  );
                }}
              >
                <RotateCcw size={14} />
                <span>Reset design</span>
              </button>
            </div>
            <p role="status">
              {message || "Drag a corner or wall. Drag empty space to orbit."}
            </p>
            <button className="study-export" onClick={exportStudy}>
              <Download size={15} />
              <span>Save study file</span>
            </button>
          </div>
        ) : (
          <span className="study-orbit-hint" hidden={!ready}>
            <ArrowDown size={13} />{" "}
            {chapter === 2
              ? "Keep scrolling to discover the work"
              : "Scroll to unveil the campus"}
          </span>
        )}
        {!editing && chapter > 0 && ready && (
          <button
            className="study-label-toggle"
            aria-pressed={labels}
            onClick={() => setLabels(!labels)}
          >
            {labels ? "Hide labels" : "Show labels"}
          </button>
        )}
        <span className="sr-only" role="status">
          {failed
            ? "3D editor unavailable. Original project remains available."
            : ready
              ? "Interactive campus ready."
              : "Loading the campus."}
        </span>
      </section>
    </div>
  );
}
function Dimension({
  label,
  value,
  min,
  max,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (n: number) => void;
}) {
  const [input, setInput] = useState(value.toFixed(1));
  function submit() {
    const next = Number(input);
    if (Number.isFinite(next) && next >= min && next <= max) {
      if (Math.abs(next - value) > 0.001) onCommit(next);
    } else setInput(value.toFixed(1));
  }
  return (
    <label className="study-field">
      {label}
      <span className="study-number">
        <input
          aria-label={label}
          type="number"
          min={min}
          max={max}
          step="0.5"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onBlur={submit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setInput(value.toFixed(1));
            }
          }}
        />
        <span>m</span>
      </span>
    </label>
  );
}
