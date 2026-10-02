"use client";
import type { NovelRecord } from "@/lib/types";
import { TreeEditor } from "./tree-editor";
import { Button, Input, Label, Textarea } from "./ui";

export function WorldEditor({
    novel,
    onChange,
}: {
    novel: NovelRecord;
    onChange: (n: NovelRecord) => void;
}) {
    const currencies = novel.currencies ?? [];
    return (
        <div className="space-y-8">
            <TreeEditor
                title="World"
                nodes={novel.world}
                onChange={(world) => onChange({ ...novel, world })}
            />
            <section className="border-t border-[var(--border)] pt-6">
                <div className="mb-3 flex items-center justify-between">
                    <div>
                        <h3 className="text-xs uppercase tracking-[.16em] text-[var(--muted)]">
                            Currency exchange table
                        </h3>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                            Rates are directional: 1 source currency = rate ×
                            target currency.
                        </p>
                    </div>
                    <Button
                        className="py-1 text-xs"
                        onClick={() =>
                            onChange({
                                ...novel,
                                currencies: [
                                    ...currencies,
                                    {
                                        id: crypto.randomUUID(),
                                        name: "New currency",
                                        symbol: "¤",
                                        notes: "",
                                        rates: [],
                                    },
                                ],
                            })
                        }
                    >
                        + Currency
                    </Button>
                </div>
                <div className="space-y-3">
                    {currencies.map((currency) => (
                        <div
                            key={currency.id}
                            className="border border-[var(--border)] p-3"
                        >
                            <div className="grid gap-2 md:grid-cols-[1fr_90px_auto]">
                                <div>
                                    <Label>Name</Label>
                                    <Input
                                        value={currency.name}
                                        onChange={(e) =>
                                            onChange({
                                                ...novel,
                                                currencies: currencies.map(
                                                    (c) =>
                                                        c.id === currency.id
                                                            ? {
                                                                  ...c,
                                                                  name: e.target
                                                                      .value,
                                                              }
                                                            : c,
                                                ),
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Symbol</Label>
                                    <Input
                                        value={currency.symbol}
                                        onChange={(e) =>
                                            onChange({
                                                ...novel,
                                                currencies: currencies.map(
                                                    (c) =>
                                                        c.id === currency.id
                                                            ? {
                                                                  ...c,
                                                                  symbol: e
                                                                      .target
                                                                      .value,
                                                              }
                                                            : c,
                                                ),
                                            })
                                        }
                                    />
                                </div>
                                <Button
                                    className="self-end border-[var(--danger)] py-2 text-xs text-[var(--danger)]"
                                    onClick={() =>
                                        onChange({
                                            ...novel,
                                            currencies: currencies
                                                .filter(
                                                    (c) => c.id !== currency.id,
                                                )
                                                .map((c) => ({
                                                    ...c,
                                                    rates: c.rates.filter(
                                                        (r) =>
                                                            r.toCurrencyId !==
                                                            currency.id,
                                                    ),
                                                })),
                                        })
                                    }
                                >
                                    Delete
                                </Button>
                            </div>
                            <Textarea
                                className="mt-2"
                                rows={2}
                                value={currency.notes}
                                placeholder="Notes"
                                onChange={(e) =>
                                    onChange({
                                        ...novel,
                                        currencies: currencies.map((c) =>
                                            c.id === currency.id
                                                ? {
                                                      ...c,
                                                      notes: e.target.value,
                                                  }
                                                : c,
                                        ),
                                    })
                                }
                            />
                            <div className="mt-3">
                                <div className="mb-2 flex items-center justify-between">
                                    <Label>Conversion rates</Label>
                                    <Button
                                        className="py-1 text-xs"
                                        onClick={() => {
                                            const target = currencies.find(
                                                (c) => c.id !== currency.id,
                                            );
                                            if (target)
                                                onChange({
                                                    ...novel,
                                                    currencies: currencies.map(
                                                        (c) =>
                                                            c.id === currency.id
                                                                ? {
                                                                      ...c,
                                                                      rates: [
                                                                          ...c.rates,
                                                                          {
                                                                              id: crypto.randomUUID(),
                                                                              toCurrencyId:
                                                                                  target.id,
                                                                              rate: 1,
                                                                          },
                                                                      ],
                                                                  }
                                                                : c,
                                                    ),
                                                });
                                        }}
                                    >
                                        + Rate
                                    </Button>
                                </div>
                                {currency.rates.map((rate) => (
                                    <div
                                        key={rate.id}
                                        className="mb-1 grid grid-cols-[1fr_100px_auto] gap-2"
                                    >
                                        <select
                                            className="border border-[var(--border)] bg-[var(--background)] px-2 text-xs"
                                            value={rate.toCurrencyId}
                                            onChange={(e) =>
                                                onChange({
                                                    ...novel,
                                                    currencies: currencies.map(
                                                        (c) =>
                                                            c.id === currency.id
                                                                ? {
                                                                      ...c,
                                                                      rates: c.rates.map(
                                                                          (
                                                                              r,
                                                                          ) =>
                                                                              r.id ===
                                                                              rate.id
                                                                                  ? {
                                                                                        ...r,
                                                                                        toCurrencyId:
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                    }
                                                                                  : r,
                                                                      ),
                                                                  }
                                                                : c,
                                                    ),
                                                })
                                            }
                                        >
                                            {currencies
                                                .filter(
                                                    (c) => c.id !== currency.id,
                                                )
                                                .map((c) => (
                                                    <option
                                                        key={c.id}
                                                        value={c.id}
                                                    >
                                                        {c.name}
                                                    </option>
                                                ))}
                                        </select>
                                        <Input
                                            type="number"
                                            step="0.0001"
                                            value={rate.rate}
                                            onChange={(e) =>
                                                onChange({
                                                    ...novel,
                                                    currencies: currencies.map(
                                                        (c) =>
                                                            c.id === currency.id
                                                                ? {
                                                                      ...c,
                                                                      rates: c.rates.map(
                                                                          (
                                                                              r,
                                                                          ) =>
                                                                              r.id ===
                                                                              rate.id
                                                                                  ? {
                                                                                        ...r,
                                                                                        rate: Number(
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        ),
                                                                                    }
                                                                                  : r,
                                                                      ),
                                                                  }
                                                                : c,
                                                    ),
                                                })
                                            }
                                        />
                                        <Button
                                            className="py-1 text-xs"
                                            onClick={() =>
                                                onChange({
                                                    ...novel,
                                                    currencies: currencies.map(
                                                        (c) =>
                                                            c.id === currency.id
                                                                ? {
                                                                      ...c,
                                                                      rates: c.rates.filter(
                                                                          (r) =>
                                                                              r.id !==
                                                                              rate.id,
                                                                      ),
                                                                  }
                                                                : c,
                                                    ),
                                                })
                                            }
                                        >
                                            ×
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
