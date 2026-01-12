"use client";

import { useEffect, useMemo, useState } from "react";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  color: string;
}

const STORAGE_KEY = "skynotes";

const palettes = [
  "from-sky-400/80 via-sky-500/50 to-blue-900/20",
  "from-purple-400/90 via-indigo-500/50 to-slate-900/20",
  "from-rose-400/80 via-pink-500/40 to-fuchsia-900/20",
  "from-emerald-400/80 via-teal-500/40 to-slate-900/20",
];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function getInitialNotes(): Note[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Note[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Unable to load notes", error);
    return [];
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Page() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const initial = getInitialNotes();
    setNotes(initial);
    if (initial.length) {
      setActiveId(initial[0].id);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const activeNote = useMemo(() => notes.find((n) => n.id === activeId) ?? null, [notes, activeId]);

  const filteredNotes = useMemo(() => {
    if (!searchTerm.trim()) {
      return [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
    }

    const term = searchTerm.toLowerCase();
    return [...notes]
      .filter((note) =>
        note.title.toLowerCase().includes(term) || note.content.toLowerCase().includes(term)
      )
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  }, [notes, searchTerm]);

  function createNote() {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: createId(),
      title: "Untitled",
      content: "",
      createdAt: now,
      updatedAt: now,
      pinned: false,
      color: palettes[Math.floor(Math.random() * palettes.length)],
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveId(newNote.id);
  }

  function updateNote(id: string, payload: Partial<Pick<Note, "title" | "content" | "pinned" | "color">>) {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? {
              ...note,
              ...payload,
              updatedAt: new Date().toISOString(),
            }
          : note
      )
    );
  }

  function deleteNote(id: string) {
    setNotes((prev) => {
      const filtered = prev.filter((note) => note.id !== id);
      if (activeId === id) {
        setActiveId(filtered.length ? filtered[0].id : null);
      }
      return filtered;
    });
  }

  function duplicateNote(id: string) {
    const target = notes.find((note) => note.id === id);
    if (!target) return;
    const now = new Date().toISOString();
    const copy: Note = {
      ...target,
      id: createId(),
      title: `${target.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [copy, ...prev]);
    setActiveId(copy.id);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-12 text-slate-100 lg:flex-row">
      <section className="lg:w-80">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-sky-500/20 p-3 text-sky-300">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15V5a2 2 0 0 0-2-2H9l-6 6v11a2 2 0 0 0 2 2h7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 3v4a1 1 0 0 1-1 1H5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18 19h4v4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18 23a5 5 0 1 1 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">SkyNotes</h1>
            <p className="text-sm text-slate-400">A minimal, beautiful notebook for fast ideas.</p>
          </div>
        </div>

        <div className="note-card w-full space-y-4 p-5">
          <button
            onClick={createNote}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2 font-medium text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400"
          >
            <span>New Note</span>
            <span aria-hidden>＋</span>
          </button>

          <div>
            <label className="block text-xs uppercase tracking-[0.25em] text-slate-400">Search</label>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Filter notes..."
              className="mt-2 w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
            />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {filteredNotes.length === 0 ? (
            <div className="note-card p-6 text-center text-sm text-slate-400">
              No notes yet. Create one to get started.
            </div>
          ) : (
            filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => setActiveId(note.id)}
                className={`note-card block w-full rounded-3xl border border-transparent px-5 py-4 text-left transition hover:border-sky-500/40 ${
                  activeId === note.id ? "border-sky-500/60" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-slate-100 line-clamp-1">{note.title || "Untitled"}</h2>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      updateNote(note.id, { pinned: !note.pinned });
                    }}
                    className={`rounded-full px-2 py-1 text-xs font-medium transition ${
                      note.pinned ? "bg-amber-400/20 text-amber-200" : "bg-slate-700/40 text-slate-400"
                    }`}
                  >
                    {note.pinned ? "Pinned" : "Pin"}
                  </button>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-400">{note.content || "Tap to start typing..."}</p>
                <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Updated {formatDate(note.updatedAt)}</p>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="flex flex-1 flex-col">
        {activeNote ? (
          <div className="note-card relative flex h-full flex-1 flex-col overflow-hidden border border-slate-700/30">
            <div className={`absolute inset-0 blur-3xl ${activeNote.color}`} aria-hidden />
            <div className="relative flex flex-1 flex-col gap-5 p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 flex-col">
                  <input
                    value={activeNote.title}
                    onChange={(event) => updateNote(activeNote.id, { title: event.target.value })}
                    placeholder="Note title"
                    className="w-full bg-transparent text-3xl font-semibold text-slate-100 outline-none placeholder:text-slate-500"
                  />
                  <span className="mt-1 text-xs uppercase tracking-widest text-slate-400">
                    Last saved {formatDate(activeNote.updatedAt)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => updateNote(activeNote.id, { pinned: !activeNote.pinned })}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                      activeNote.pinned ? "bg-amber-400/30 text-amber-200" : "bg-slate-800/60 text-slate-200"
                    }`}
                  >
                    {activeNote.pinned ? "Pinned" : "Pin"}
                  </button>
                  <button
                    onClick={() => duplicateNote(activeNote.id)}
                    className="rounded-xl bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700/60"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => deleteNote(activeNote.id)}
                    className="rounded-xl bg-rose-500/40 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/60"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <textarea
                value={activeNote.content}
                onChange={(event) => updateNote(activeNote.id, { content: event.target.value })}
                placeholder="Collect ideas, outlines, and todos. Your notes stay on this device."
                className="h-full flex-1 resize-none rounded-2xl border border-slate-700/40 bg-slate-900/30 p-6 text-base leading-relaxed text-slate-100 shadow-inner outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                <span>Created {formatDate(activeNote.createdAt)}</span>
                <div className="flex items-center gap-2">
                  <span>Accent</span>
                  {palettes.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateNote(activeNote.id, { color })}
                      className={`h-6 w-6 rounded-full border border-white/10 bg-gradient-to-br ${color} transition hover:scale-110 ${
                        activeNote.color === color ? "ring-2 ring-sky-400" : ""
                      }`}
                      aria-label="Change accent"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="note-card flex h-full flex-1 items-center justify-center border border-dashed border-slate-700/60 p-12 text-center text-slate-400">
            Choose or create a note to begin.
          </div>
        )}
      </section>
    </main>
  );
}
