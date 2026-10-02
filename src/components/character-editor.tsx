"use client";
import { useMemo, useState } from "react";
import {
    Background,
    Controls,
    Edge,
    MiniMap,
    Node,
    ReactFlow,
} from "@xyflow/react";
import { characterDefaults } from "@/lib/defaults";
import type { CharacterRecord, ManifestRecord, NovelRecord } from "@/lib/types";
import { TreeEditor } from "./tree-editor";
import { Button, Input, Label, Textarea } from "./ui";

const MAX_IMAGE = 2 * 1024 * 1024;
export function CharacterEditor({
    novel,
    manifest,
    onNovel,
    onManifest,
}: {
    novel: NovelRecord;
    manifest: ManifestRecord;
    onNovel: (n: NovelRecord) => void;
    onManifest: (m: ManifestRecord) => void;
}) {
    const [selected, setSelected] = useState(novel.characters[0]?.id ?? null);
    const [mode, setMode] = useState<"edit" | "graph">("edit");
    const character = novel.characters.find((c) => c.id === selected) ?? null;
    const update = (id: string, fn: (c: CharacterRecord) => CharacterRecord) =>
        onNovel({
            ...novel,
            characters: novel.characters.map((c) => (c.id === id ? fn(c) : c)),
        });
    const nodes: Node[] = useMemo(
        () =>
            novel.characters.map((c, i) => ({
                id: c.id,
                position: { x: (i % 4) * 220, y: Math.floor(i / 4) * 150 },
                data: { label: c.name },
                style: {
                    border: `1px solid ${c.color}`,
                    borderRadius: 0,
                    background: "var(--panel)",
                    color: "var(--text)",
                    width: 170,
                },
            })),
        [novel.characters],
    );
    const edges: Edge[] = useMemo(
        () =>
            novel.characters.flatMap((c) =>
                c.relationships.map((r) => ({
                    id: r.id,
                    source: c.id,
                    target: r.targetCharacterId,
                    label: r.connectionType,
                    style: { stroke: r.color },
                    labelStyle: { fill: "var(--text)" },
                })),
            ),
        [novel.characters],
    );
    const addCharacter = () => {
        const c = characterDefaults();
        onNovel({ ...novel, characters: [...novel.characters, c] });
        setSelected(c.id);
    };
    if (mode === "graph")
        return (
            <div className="h-[calc(100vh-9rem)] border border-[var(--border)]">
                <div className="flex items-center justify-between border-b border-[var(--border)] p-2">
                    <span className="text-xs uppercase tracking-[.14em] text-[var(--muted)]">
                        Relationship graph
                    </span>
                    <Button
                        onClick={() => setMode("edit")}
                        className="py-1 text-xs"
                    >
                        Edit characters
                    </Button>
                </div>
                <ReactFlow nodes={nodes} edges={edges} fitView>
                    <Background />
                    <MiniMap />
                    <Controls />
                </ReactFlow>
            </div>
        );
    return (
        <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
            <aside className="border-r border-[var(--border)] pr-4">
                <div className="mb-3 flex gap-2">
                    <Button
                        onClick={addCharacter}
                        className="flex-1 py-1 text-xs"
                    >
                        + Character
                    </Button>
                    <Button
                        onClick={() => setMode("graph")}
                        className="py-1 text-xs"
                    >
                        Graph
                    </Button>
                </div>
                {novel.characters.map((c) => (
                    <button
                        key={c.id}
                        onClick={() => setSelected(c.id)}
                        className={`mb-px w-full border-l-2 px-3 py-2 text-left text-sm ${c.id === selected ? "border-[var(--accent)] bg-[var(--panel-soft)]" : "border-transparent"}`}
                    >
                        {c.name}
                    </button>
                ))}
            </aside>
            {character ? (
                <div className="space-y-6">
                    <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                        <div>
                            <Label>Name</Label>
                            <Input
                                value={character.name}
                                onChange={(e) =>
                                    update(character.id, (c) => ({
                                        ...c,
                                        name: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div>
                            <Label>Color</Label>
                            <Input
                                type="color"
                                value={character.color}
                                onChange={(e) =>
                                    update(character.id, (c) => ({
                                        ...c,
                                        color: e.target.value,
                                    }))
                                }
                                className="h-10 p-1"
                            />
                        </div>
                    </div>
                    <TreeEditor
                        title="Character profile"
                        nodes={character.fields}
                        onChange={(fields) =>
                            update(character.id, (c) => ({ ...c, fields }))
                        }
                    />
                    <section>
                        <div className="mb-2 flex items-center justify-between">
                            <h3 className="text-xs uppercase tracking-[.14em] text-[var(--muted)]">
                                Gallery · max 2 MB per image
                            </h3>
                            <label className="cursor-pointer border border-[var(--border)] px-3 py-1 text-xs">
                                + Image
                                <input
                                    hidden
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const f = e.target.files?.[0];
                                        if (!f || f.size > MAX_IMAGE) return;
                                        const dataUrl =
                                            await new Promise<string>((res) => {
                                                const r = new FileReader();
                                                r.onload = () =>
                                                    res(String(r.result));
                                                r.readAsDataURL(f);
                                            });
                                        update(character.id, (c) => ({
                                            ...c,
                                            gallery: [
                                                ...c.gallery,
                                                {
                                                    id: crypto.randomUUID(),
                                                    name: f.name,
                                                    mimeType: f.type,
                                                    size: f.size,
                                                    dataUrl,
                                                    createdAt:
                                                        new Date().toISOString(),
                                                },
                                            ],
                                        }));
                                    }}
                                />
                            </label>
                        </div>
                        <div className="grid grid-cols-3 gap-px bg-[var(--border)]">
                            {character.gallery.map((g) => (
                                <img
                                    key={g.id}
                                    src={g.dataUrl}
                                    alt={g.name}
                                    className="aspect-square w-full bg-[var(--panel)] object-cover"
                                />
                            ))}
                        </div>
                    </section>
                    <section>
                        <div className="mb-2 flex items-center justify-between">
                            <h3 className="text-xs uppercase tracking-[.14em] text-[var(--muted)]">
                                Relationships
                            </h3>
                            <Button
                                className="py-1 text-xs"
                                onClick={() => {
                                    const target = novel.characters.find(
                                        (c) => c.id !== character.id,
                                    );
                                    if (target)
                                        update(character.id, (c) => ({
                                            ...c,
                                            relationships: [
                                                ...c.relationships,
                                                {
                                                    id: crypto.randomUUID(),
                                                    targetCharacterId:
                                                        target.id,
                                                    connectionType: "knows",
                                                    comment: "",
                                                    reciprocal: false,
                                                    color: "#79a8ff",
                                                },
                                            ],
                                        }));
                                }}
                            >
                                + Relation
                            </Button>
                        </div>
                        {character.relationships.map((r) => (
                            <div
                                key={r.id}
                                className="grid gap-2 border-t border-[var(--border)] py-3 md:grid-cols-4"
                            >
                                <select
                                    value={r.targetCharacterId}
                                    onChange={(e) =>
                                        update(character.id, (c) => ({
                                            ...c,
                                            relationships: c.relationships.map(
                                                (x) =>
                                                    x.id === r.id
                                                        ? {
                                                              ...x,
                                                              targetCharacterId:
                                                                  e.target
                                                                      .value,
                                                          }
                                                        : x,
                                            ),
                                        }))
                                    }
                                    className="bg-[var(--background)] p-2 text-sm"
                                >
                                    {novel.characters
                                        .filter((c) => c.id !== character.id)
                                        .map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                </select>
                                <Input
                                    value={r.connectionType}
                                    onChange={(e) =>
                                        update(character.id, (c) => ({
                                            ...c,
                                            relationships: c.relationships.map(
                                                (x) =>
                                                    x.id === r.id
                                                        ? {
                                                              ...x,
                                                              connectionType:
                                                                  e.target
                                                                      .value,
                                                          }
                                                        : x,
                                            ),
                                        }))
                                    }
                                />
                                <Input
                                    value={r.comment}
                                    placeholder="Comment"
                                    onChange={(e) =>
                                        update(character.id, (c) => ({
                                            ...c,
                                            relationships: c.relationships.map(
                                                (x) =>
                                                    x.id === r.id
                                                        ? {
                                                              ...x,
                                                              comment:
                                                                  e.target
                                                                      .value,
                                                          }
                                                        : x,
                                            ),
                                        }))
                                    }
                                />
                                <label className="flex items-center gap-2 text-xs">
                                    <input
                                        type="checkbox"
                                        checked={r.reciprocal}
                                        onChange={(e) =>
                                            update(character.id, (c) => ({
                                                ...c,
                                                relationships:
                                                    c.relationships.map((x) =>
                                                        x.id === r.id
                                                            ? {
                                                                  ...x,
                                                                  reciprocal:
                                                                      e.target
                                                                          .checked,
                                                              }
                                                            : x,
                                                    ),
                                            }))
                                        }
                                    />{" "}
                                    reciprocal
                                </label>
                            </div>
                        ))}
                    </section>
                    <section>
                        <h3 className="mb-2 text-xs uppercase tracking-[.14em] text-[var(--muted)]">
                            Cross-novel identity
                        </h3>
                        {character.sharedEntityId ? (
                            <div className="flex items-center gap-3 text-sm">
                                <span>
                                    Linked as{" "}
                                    {
                                        manifest.sharedEntities.find(
                                            (x) =>
                                                x.id ===
                                                character.sharedEntityId,
                                        )?.name
                                    }
                                </span>
                                <Button
                                    className="py-1 text-xs"
                                    onClick={() =>
                                        update(character.id, (c) => ({
                                            ...c,
                                            sharedEntityId: null,
                                        }))
                                    }
                                >
                                    Unlink
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    className="py-1 text-xs"
                                    onClick={() => {
                                        const shared = {
                                            id: crypto.randomUUID(),
                                            type: "character" as const,
                                            name: character.name,
                                            color: character.color,
                                            links: [
                                                {
                                                    novelId: novel.id,
                                                    entityId: character.id,
                                                    label: character.name,
                                                },
                                            ],
                                        };
                                        onManifest({
                                            ...manifest,
                                            sharedEntities: [
                                                ...manifest.sharedEntities,
                                                shared,
                                            ],
                                        });
                                        update(character.id, (c) => ({
                                            ...c,
                                            sharedEntityId: shared.id,
                                        }));
                                    }}
                                >
                                    Create shared identity
                                </Button>
                                {manifest.sharedEntities
                                    .filter((x) => x.type === "character")
                                    .map((shared) => (
                                        <Button
                                            key={shared.id}
                                            className="py-1 text-xs"
                                            onClick={() => {
                                                onManifest({
                                                    ...manifest,
                                                    sharedEntities:
                                                        manifest.sharedEntities.map(
                                                            (x) =>
                                                                x.id ===
                                                                shared.id
                                                                    ? {
                                                                          ...x,
                                                                          links: [
                                                                              ...x.links,
                                                                              {
                                                                                  novelId:
                                                                                      novel.id,
                                                                                  entityId:
                                                                                      character.id,
                                                                                  label: character.name,
                                                                              },
                                                                          ],
                                                                      }
                                                                    : x,
                                                        ),
                                                });
                                                update(character.id, (c) => ({
                                                    ...c,
                                                    sharedEntityId: shared.id,
                                                }));
                                            }}
                                        >
                                            Link to {shared.name}
                                        </Button>
                                    ))}
                            </div>
                        )}
                    </section>
                </div>
            ) : (
                <div className="p-8 text-sm text-[var(--muted)]">
                    Create a character to begin.
                </div>
            )}
        </div>
    );
}
