"use client";
import { useMemo, useState } from "react";
import { useDumkohray } from "./dumkohray-provider";
import { AppShell } from "./app-shell";
import { TreeEditor } from "./tree-editor";
import { CharacterEditor } from "./character-editor";
import { TimelineEditor } from "./timeline-editor";
import { WorldEditor } from "./world-editor";
import { Button, Input, Label, Textarea } from "./ui";
import type { NoteRecord, NovelRecord } from "@/lib/types";

type Tab =
    | "write"
    | "design"
    | "characters"
    | "world"
    | "timeline"
    | "notes"
    | "custom"
    | "settings";
function countWords(text: string) {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
}
function Cover({ novel }: { novel: NovelRecord }) {
    const size =
        novel.title.length > 55
            ? 15
            : novel.title.length > 32
              ? 18
              : novel.title.length > 18
                ? 22
                : 28;
    return novel.settings.coverDataUrl ? (
        <img
            src={novel.settings.coverDataUrl}
            alt="Novel cover"
            className="aspect-[2/3] w-full object-cover"
        />
    ) : (
        <div className="grid aspect-[2/3] w-full place-items-center bg-white p-5 text-center text-black">
            <div
                className="max-w-full break-words font-serif font-semibold leading-tight"
                style={{ fontSize: size }}
            >
                {novel.title}
            </div>
        </div>
    );
}
export function NovelWorkspace({ id }: { id: string }) {
    const {
        ready,
        manifest,
        novels,
        updateNovel,
        updateManifest,
        estimatedBytes,
    } = useDumkohray();
    const [tab, setTab] = useState<Tab>("write");
    const [tagFilter, setTagFilter] = useState("");
    const novel = useMemo(() => novels.find((n) => n.id === id), [novels, id]);
    if (!ready || !manifest)
        return (
            <div className="grid min-h-screen place-items-center text-[var(--muted)]">
                Opening novel…
            </div>
        );
    if (!novel)
        return (
            <AppShell title="Missing novel" backHref="/">
                <div className="p-8">Novel not found.</div>
            </AppShell>
        );
    const setNovel = (next: NovelRecord) => updateNovel(id, () => next);
    const tabs: [Tab, string][] = [
        ["write", "Write"],
        ["design", "Design"],
        ["characters", "Characters"],
        ["world", "World"],
        ["timeline", "Timeline"],
        ["notes", "Notes"],
        ["custom", "Modules"],
        ["settings", "Novel settings"],
    ];
    const tags = [...new Set(novel.notes.flatMap((n) => n.tags))].sort();
    const notes = tagFilter
        ? novel.notes.filter((n) => n.tags.includes(tagFilter))
        : novel.notes;
    return (
        <AppShell title={novel.title} backHref="/">
            <div className="grid min-h-[calc(100vh-3.5rem)] md:grid-cols-[180px_1fr]">
                <aside className="border-r border-[var(--border)] bg-[var(--panel)] p-2">
                    {tabs.map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`mb-px w-full border-l-2 px-3 py-2.5 text-left text-sm ${tab === key ? "border-[var(--accent)] bg-[var(--panel-soft)]" : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"}`}
                        >
                            {label}
                        </button>
                    ))}
                    <div className="mt-6 border-t border-[var(--border)] px-3 pt-4 text-[10px] uppercase tracking-[.12em] text-[var(--muted)]">
                        {(estimatedBytes / 1024 / 1024).toFixed(2)} MB local
                        payload
                    </div>
                </aside>
                <section className="min-w-0 p-4 md:p-7">
                    {tab === "write" ? (
                        <div className="mx-auto max-w-4xl">
                            <div className="mb-4 flex items-end justify-between border-b border-[var(--border)] pb-3">
                                <div>
                                    <div className="text-xs uppercase tracking-[.14em] text-[var(--muted)]">
                                        Manuscript
                                    </div>
                                    <h1 className="mt-1 text-2xl font-light">
                                        {novel.title}
                                    </h1>
                                </div>
                                <div className="text-xs text-[var(--muted)]">
                                    {countWords(
                                        novel.manuscript,
                                    ).toLocaleString()}{" "}
                                    words
                                </div>
                            </div>
                            <textarea
                                value={novel.manuscript}
                                onChange={(e) =>
                                    setNovel({
                                        ...novel,
                                        manuscript: e.target.value,
                                    })
                                }
                                placeholder="Begin…"
                                spellCheck
                                className="editor-textarea min-h-[72vh] w-full resize-none bg-transparent font-serif outline-none"
                                style={{
                                    fontSize: manifest.settings.editorFontSize,
                                    lineHeight:
                                        manifest.settings.editorLineHeight,
                                }}
                            />
                        </div>
                    ) : null}
                    {tab === "design" ? (
                        <TreeEditor
                            title="Design document"
                            nodes={novel.design}
                            onChange={(design) =>
                                setNovel({ ...novel, design })
                            }
                        />
                    ) : null}
                    {tab === "characters" ? (
                        <CharacterEditor
                            novel={novel}
                            manifest={manifest}
                            onNovel={setNovel}
                            onManifest={(m) => updateManifest(() => m)}
                        />
                    ) : null}
                    {tab === "world" ? (
                        <WorldEditor novel={novel} onChange={setNovel} />
                    ) : null}
                    {tab === "custom" ? (
                        <div>
                            <TreeEditor
                                title="Custom top-level modules"
                                nodes={novel.customModules}
                                onChange={(customModules) =>
                                    setNovel({ ...novel, customModules })
                                }
                            />
                            <p className="mt-3 text-xs text-[var(--muted)]">
                                Use this for any category beyond Design,
                                Characters, and World. Trees can nest
                                indefinitely.
                            </p>
                        </div>
                    ) : null}
                    {tab === "timeline" ? (
                        <TimelineEditor novel={novel} onChange={setNovel} />
                    ) : null}
                    {tab === "notes" ? (
                        <div className="grid gap-5 lg:grid-cols-[180px_1fr]">
                            <aside>
                                <Button
                                    className="mb-3 w-full py-1 text-xs"
                                    onClick={() => {
                                        const now = new Date().toISOString();
                                        const n: NoteRecord = {
                                            id: crypto.randomUUID(),
                                            name: "New note",
                                            text: "",
                                            tags: [],
                                            createdAt: now,
                                            updatedAt: now,
                                        };
                                        setNovel({
                                            ...novel,
                                            notes: [n, ...novel.notes],
                                        });
                                    }}
                                >
                                    + Note
                                </Button>
                                <button
                                    onClick={() => setTagFilter("")}
                                    className={`block w-full px-2 py-1 text-left text-xs ${!tagFilter ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}
                                >
                                    All tags
                                </button>
                                {tags.map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTagFilter(t)}
                                        className={`block w-full px-2 py-1 text-left text-xs ${tagFilter === t ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}
                                    >
                                        #{t}
                                    </button>
                                ))}
                            </aside>
                            <div className="space-y-3">
                                {notes.map((n) => (
                                    <div
                                        key={n.id}
                                        className="border border-[var(--border)] p-3"
                                    >
                                        <Input
                                            value={n.name}
                                            onChange={(e) =>
                                                setNovel({
                                                    ...novel,
                                                    notes: novel.notes.map(
                                                        (x) =>
                                                            x.id === n.id
                                                                ? {
                                                                      ...x,
                                                                      name: e
                                                                          .target
                                                                          .value,
                                                                      updatedAt:
                                                                          new Date().toISOString(),
                                                                  }
                                                                : x,
                                                    ),
                                                })
                                            }
                                            className="border-0 px-0 text-base font-medium"
                                        />
                                        <Input
                                            value={n.tags.join(", ")}
                                            onChange={(e) =>
                                                setNovel({
                                                    ...novel,
                                                    notes: novel.notes.map(
                                                        (x) =>
                                                            x.id === n.id
                                                                ? {
                                                                      ...x,
                                                                      tags: e.target.value
                                                                          .split(
                                                                              ",",
                                                                          )
                                                                          .map(
                                                                              (
                                                                                  v,
                                                                              ) =>
                                                                                  v.trim(),
                                                                          )
                                                                          .filter(
                                                                              Boolean,
                                                                          ),
                                                                      updatedAt:
                                                                          new Date().toISOString(),
                                                                  }
                                                                : x,
                                                    ),
                                                })
                                            }
                                            placeholder="tags, comma, separated"
                                            className="mt-1 border-0 px-0 text-xs text-[var(--muted)]"
                                        />
                                        <Textarea
                                            value={n.text}
                                            onChange={(e) =>
                                                setNovel({
                                                    ...novel,
                                                    notes: novel.notes.map(
                                                        (x) =>
                                                            x.id === n.id
                                                                ? {
                                                                      ...x,
                                                                      text: e
                                                                          .target
                                                                          .value,
                                                                      updatedAt:
                                                                          new Date().toISOString(),
                                                                  }
                                                                : x,
                                                    ),
                                                })
                                            }
                                            rows={6}
                                            className="mt-2 border-0 px-0"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                    {tab === "settings" ? (
                        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[220px_1fr]">
                            <div>
                                <Cover novel={novel} />
                                <label className="mt-2 block cursor-pointer border border-[var(--border)] px-3 py-2 text-center text-xs">
                                    Set cover image
                                    <input
                                        hidden
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const f = e.target.files?.[0];
                                            if (!f || f.size > 2 * 1024 * 1024)
                                                return;
                                            const dataUrl =
                                                await new Promise<string>(
                                                    (r) => {
                                                        const fr =
                                                            new FileReader();
                                                        fr.onload = () =>
                                                            r(
                                                                String(
                                                                    fr.result,
                                                                ),
                                                            );
                                                        fr.readAsDataURL(f);
                                                    },
                                                );
                                            setNovel({
                                                ...novel,
                                                settings: {
                                                    ...novel.settings,
                                                    coverDataUrl: dataUrl,
                                                },
                                            });
                                        }}
                                    />
                                </label>
                                <div className="mt-2 text-[10px] text-[var(--muted)]">
                                    Max cover: 2 MB. Default is a generated
                                    white title cover.
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>Title</Label>
                                    <Input
                                        value={novel.title}
                                        onChange={(e) =>
                                            setNovel({
                                                ...novel,
                                                title: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Subtitle</Label>
                                    <Input
                                        value={novel.settings.subtitle}
                                        onChange={(e) =>
                                            setNovel({
                                                ...novel,
                                                settings: {
                                                    ...novel.settings,
                                                    subtitle: e.target.value,
                                                },
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Author</Label>
                                    <Input
                                        value={novel.settings.author}
                                        onChange={(e) =>
                                            setNovel({
                                                ...novel,
                                                settings: {
                                                    ...novel.settings,
                                                    author: e.target.value,
                                                },
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Genre</Label>
                                    <Input
                                        value={novel.settings.genre}
                                        onChange={(e) =>
                                            setNovel({
                                                ...novel,
                                                settings: {
                                                    ...novel.settings,
                                                    genre: e.target.value,
                                                },
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Language</Label>
                                    <Input
                                        value={novel.settings.language}
                                        onChange={(e) =>
                                            setNovel({
                                                ...novel,
                                                settings: {
                                                    ...novel.settings,
                                                    language: e.target.value,
                                                },
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Target words</Label>
                                    <Input
                                        type="number"
                                        value={novel.settings.targetWordCount}
                                        onChange={(e) =>
                                            setNovel({
                                                ...novel,
                                                settings: {
                                                    ...novel.settings,
                                                    targetWordCount: Number(
                                                        e.target.value,
                                                    ),
                                                },
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <select
                                        className="w-full border border-[var(--border)] bg-[var(--background)] p-2 text-sm"
                                        value={novel.settings.status}
                                        onChange={(e) =>
                                            setNovel({
                                                ...novel,
                                                settings: {
                                                    ...novel.settings,
                                                    status: e.target
                                                        .value as NovelRecord["settings"]["status"],
                                                },
                                            })
                                        }
                                    >
                                        <option value="idea">Idea</option>
                                        <option value="draft">Draft</option>
                                        <option value="revision">
                                            Revision
                                        </option>
                                        <option value="complete">
                                            Complete
                                        </option>
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <Label>Synopsis</Label>
                                    <Textarea
                                        rows={6}
                                        value={novel.settings.synopsis}
                                        onChange={(e) =>
                                            setNovel({
                                                ...novel,
                                                settings: {
                                                    ...novel.settings,
                                                    synopsis: e.target.value,
                                                },
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    ) : null}
                </section>
            </div>
        </AppShell>
    );
}
