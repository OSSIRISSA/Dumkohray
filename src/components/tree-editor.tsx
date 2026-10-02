"use client";
import { useState } from "react";
import type { TopicNode } from "@/lib/types";
import { Button, Input, Textarea } from "./ui";

function makeNode(title = "New topic"): TopicNode {
    return { id: crypto.randomUUID(), title, text: "", children: [] };
}
function mapNode(
    nodes: TopicNode[],
    id: string,
    fn: (n: TopicNode) => TopicNode,
): TopicNode[] {
    return nodes.map((n) =>
        n.id === id ? fn(n) : { ...n, children: mapNode(n.children, id, fn) },
    );
}
function removeNode(nodes: TopicNode[], id: string): TopicNode[] {
    return nodes
        .filter((n) => n.id !== id)
        .map((n) => ({ ...n, children: removeNode(n.children, id) }));
}
function addChild(nodes: TopicNode[], id: string): TopicNode[] {
    return mapNode(nodes, id, (n) => ({
        ...n,
        children: [...n.children, makeNode()],
    }));
}
function move(nodes: TopicNode[], id: string, dir: -1 | 1): TopicNode[] {
    const idx = nodes.findIndex((n) => n.id === id);
    if (idx >= 0) {
        const next = [...nodes];
        const target = idx + dir;
        if (target >= 0 && target < next.length)
            [next[idx], next[target]] = [next[target], next[idx]];
        return next;
    }
    return nodes.map((n) => ({ ...n, children: move(n.children, id, dir) }));
}
export function TreeEditor({
    nodes,
    onChange,
    title = "Topics",
}: {
    nodes: TopicNode[];
    onChange: (nodes: TopicNode[]) => void;
    title?: string;
}) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const render = (list: TopicNode[], depth = 0) => (
        <div>
            {list.map((node) => (
                <div
                    key={node.id}
                    className="border-b border-[var(--border)] last:border-b-0"
                    style={{ marginLeft: depth * 14 }}
                >
                    <div className="grid grid-cols-[22px_1fr_auto] items-center gap-2 py-2">
                        <button
                            onClick={() =>
                                setExpanded((x) => ({
                                    ...x,
                                    [node.id]: !x[node.id],
                                }))
                            }
                            className="text-xs text-[var(--muted)]"
                        >
                            {node.children.length
                                ? expanded[node.id] === false
                                    ? "+"
                                    : "−"
                                : "·"}
                        </button>
                        <Input
                            value={node.title}
                            onChange={(e) =>
                                onChange(
                                    mapNode(nodes, node.id, (n) => ({
                                        ...n,
                                        title: e.target.value,
                                    })),
                                )
                            }
                            className="border-0 bg-transparent px-1 font-medium"
                        />
                        <div className="flex text-xs text-[var(--muted)]">
                            <button
                                onClick={() =>
                                    onChange(move(nodes, node.id, -1))
                                }
                                className="px-1"
                            >
                                ↑
                            </button>
                            <button
                                onClick={() =>
                                    onChange(move(nodes, node.id, 1))
                                }
                                className="px-1"
                            >
                                ↓
                            </button>
                            <button
                                onClick={() =>
                                    onChange(addChild(nodes, node.id))
                                }
                                className="px-1"
                            >
                                + child
                            </button>
                            <button
                                onClick={() =>
                                    onChange(removeNode(nodes, node.id))
                                }
                                className="px-1 hover:text-[var(--danger)]"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                    <Textarea
                        value={node.text}
                        onChange={(e) =>
                            onChange(
                                mapNode(nodes, node.id, (n) => ({
                                    ...n,
                                    text: e.target.value,
                                })),
                            )
                        }
                        placeholder={`Notes for ${node.title}…`}
                        rows={2}
                        className="mb-2 border-l-2 border-y-0 border-r-0"
                    />
                    {node.children.length && expanded[node.id] !== false
                        ? render(node.children, depth + 1)
                        : null}
                </div>
            ))}
        </div>
    );
    return (
        <section>
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs uppercase tracking-[.16em] text-[var(--muted)]">
                    {title}
                </h2>
                <Button
                    onClick={() => onChange([...nodes, makeNode()])}
                    className="py-1 text-xs"
                >
                    + Topic
                </Button>
            </div>
            <div className="border border-[var(--border)] bg-[var(--panel)]">
                {render(nodes)}
            </div>
        </section>
    );
}
