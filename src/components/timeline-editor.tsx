"use client";
import { useCallback, useMemo, useState } from "react";
import {
    Background,
    Connection,
    Controls,
    Edge,
    MiniMap,
    Node,
    ReactFlow,
} from "@xyflow/react";
import type { NovelRecord } from "@/lib/types";
import { Button, Input, Label, Textarea } from "./ui";

export function TimelineEditor({
    novel,
    onChange,
}: {
    novel: NovelRecord;
    onChange: (n: NovelRecord) => void;
}) {
    const [selected, setSelected] = useState<string | null>(
        novel.timelineEvents[0]?.id ?? null,
    );
    const current = novel.timelineEvents.find((e) => e.id === selected) ?? null;
    const nodes: Node[] = useMemo(
        () =>
            novel.timelineEvents.map((e) => ({
                id: e.id,
                position: { x: e.x, y: e.y },
                data: {
                    label: (
                        <div>
                            <strong>{e.title}</strong>
                            <div style={{ fontSize: 10, opacity: 0.65 }}>
                                {e.dateLabel}
                            </div>
                        </div>
                    ),
                },
                style: {
                    border: `1px solid ${e.color}`,
                    borderRadius: 0,
                    background: "var(--panel)",
                    color: "var(--text)",
                    width: 190,
                },
            })),
        [novel.timelineEvents],
    );
    const edges: Edge[] = useMemo(
        () => novel.timelineLinks.map((e) => ({ ...e })),
        [novel.timelineLinks],
    );
    const connect = useCallback(
        (c: Connection) => {
            if (!c.source || !c.target) return;
            onChange({
                ...novel,
                timelineLinks: [
                    ...novel.timelineLinks,
                    {
                        id: crypto.randomUUID(),
                        source: c.source,
                        target: c.target,
                    },
                ],
            });
        },
        [novel, onChange],
    );
    const updateEvent = (patch: Partial<NonNullable<typeof current>>) => {
        if (!current) return;
        onChange({
            ...novel,
            timelineEvents: novel.timelineEvents.map((e) =>
                e.id === current.id ? { ...e, ...patch } : e,
            ),
        });
    };
    const addEvent = () => {
        const e = {
            id: crypto.randomUUID(),
            title: "New event",
            text: "",
            dateLabel: "",
            x: 80 + novel.timelineEvents.length * 40,
            y: 80 + novel.timelineEvents.length * 30,
            color: "#84f7c5",
        };
        onChange({ ...novel, timelineEvents: [...novel.timelineEvents, e] });
        setSelected(e.id);
    };
    return (
        <div className="grid h-[calc(100vh-9rem)] border border-[var(--border)] lg:grid-cols-[1fr_260px]">
            <div className="min-h-0">
                <div className="flex items-center justify-between border-b border-[var(--border)] p-2">
                    <span className="text-xs uppercase tracking-[.14em] text-[var(--muted)]">
                        Timeline blueprint
                    </span>
                    <Button className="py-1 text-xs" onClick={addEvent}>
                        + Event
                    </Button>
                </div>
                <div className="h-[calc(100%-41px)]">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onConnect={connect}
                        onNodeClick={(_, node) => setSelected(node.id)}
                        onNodesChange={(changes) => {
                            const positions = new Map<
                                string,
                                { x: number; y: number }
                            >();
                            changes.forEach((c) => {
                                if (c.type === "position" && c.position)
                                    positions.set(c.id, c.position);
                            });
                            if (positions.size)
                                onChange({
                                    ...novel,
                                    timelineEvents: novel.timelineEvents.map(
                                        (e) => {
                                            const p = positions.get(e.id);
                                            return p
                                                ? { ...e, x: p.x, y: p.y }
                                                : e;
                                        },
                                    ),
                                });
                        }}
                        fitView
                    >
                        <Background />
                        <MiniMap />
                        <Controls />
                    </ReactFlow>
                </div>
            </div>
            <aside className="border-l border-[var(--border)] bg-[var(--panel)] p-4">
                {current ? (
                    <div className="space-y-4">
                        <div>
                            <Label>Event</Label>
                            <Input
                                value={current.title}
                                onChange={(e) =>
                                    updateEvent({ title: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <Label>Date / epoch label</Label>
                            <Input
                                value={current.dateLabel}
                                onChange={(e) =>
                                    updateEvent({ dateLabel: e.target.value })
                                }
                                placeholder="Year 412 / Day 3 / Before the Fall"
                            />
                        </div>
                        <div>
                            <Label>Color</Label>
                            <Input
                                type="color"
                                value={current.color}
                                onChange={(e) =>
                                    updateEvent({ color: e.target.value })
                                }
                                className="h-10 p-1"
                            />
                        </div>
                        <div>
                            <Label>Event notes</Label>
                            <Textarea
                                rows={10}
                                value={current.text}
                                onChange={(e) =>
                                    updateEvent({ text: e.target.value })
                                }
                            />
                        </div>
                        <Button
                            className="w-full border-[var(--danger)] text-[var(--danger)]"
                            onClick={() => {
                                onChange({
                                    ...novel,
                                    timelineEvents: novel.timelineEvents.filter(
                                        (e) => e.id !== current.id,
                                    ),
                                    timelineLinks: novel.timelineLinks.filter(
                                        (l) =>
                                            l.source !== current.id &&
                                            l.target !== current.id,
                                    ),
                                });
                                setSelected(null);
                            }}
                        >
                            Delete event
                        </Button>
                    </div>
                ) : (
                    <div className="text-sm text-[var(--muted)]">
                        Select an event.
                    </div>
                )}
            </aside>
        </div>
    );
}
