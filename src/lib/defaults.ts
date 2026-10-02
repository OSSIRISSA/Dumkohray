import type {
    CharacterRecord,
    ManifestRecord,
    NovelRecord,
    ThemePalette,
    ThemeRecord,
    TopicNode,
} from "./types";

export const DEFAULT_PALETTE: ThemePalette = {
    background: "#07090c",
    panel: "#0c0f14",
    panelSoft: "#11161d",
    text: "#e8edf3",
    muted: "#7e8998",
    accent: "#84f7c5",
    accentText: "#04100b",
    border: "#29313c",
    danger: "#ff6b7a",
    success: "#84f7c5",
    graphA: "#84f7c5",
    graphB: "#79a8ff",
    graphC: "#e29bff",
};

export const BUILTIN_THEMES: ThemeRecord[] = [
    {
        id: "signal",
        name: "Signal",
        palette: DEFAULT_PALETTE,
        createdAt: "builtin",
    },
    {
        id: "paper",
        name: "Paper",
        createdAt: "builtin",
        palette: {
            background: "#efeee9",
            panel: "#f9f8f3",
            panelSoft: "#e8e6de",
            text: "#181a1c",
            muted: "#6f7479",
            accent: "#1b5cff",
            accentText: "#ffffff",
            border: "#c8c9c6",
            danger: "#b9283d",
            success: "#147a50",
            graphA: "#1b5cff",
            graphB: "#8d50d8",
            graphC: "#c87017",
        },
    },
    {
        id: "mono",
        name: "Monolith",
        createdAt: "builtin",
        palette: {
            background: "#000000",
            panel: "#050505",
            panelSoft: "#0b0b0b",
            text: "#ffffff",
            muted: "#858585",
            accent: "#ffffff",
            accentText: "#000000",
            border: "#2a2a2a",
            danger: "#ffffff",
            success: "#ffffff",
            graphA: "#ffffff",
            graphB: "#a0a0a0",
            graphC: "#666666",
        },
    },
];

function node(title: string, children: TopicNode[] = []): TopicNode {
    return { id: crypto.randomUUID(), title, text: "", children };
}

export function characterDefaults(name = "New character"): CharacterRecord {
    return {
        id: crypto.randomUUID(),
        name,
        color: "#84f7c5",
        sharedEntityId: null,
        gallery: [],
        relationships: [],
        fields: [
            node("Appearance", [
                node("Distinguishing feature"),
                node("Clothing style"),
                node("Body type"),
                node("Hair"),
                node("Facial features"),
                node("Eyes"),
                node("Race"),
                node("Gender"),
                node("Age"),
            ]),
            node("Personality", [
                node("Motivation"),
                node("Goal"),
                node("Conflict"),
                node("Epiphany"),
                node("Talent"),
                node("Weakness"),
                node("Habits"),
                node("Moral"),
                node("Self-control"),
                node("Greatest fear"),
            ]),
            node("Biography"),
        ],
    };
}

export function designDefaults(): TopicNode[] {
    return [
        node("Premise"),
        node("Themes"),
        node("Reader promise"),
        node("Tone"),
        node("Structure"),
        node("Key questions"),
    ];
}

export function worldDefaults(): TopicNode[] {
    return [
        node("History", [node("Epochs"), node("Historical events")]),
        node("Economy", [
            node("Currencies", [node("Conversion rates")]),
            node("Resources"),
            node("Famous companies"),
        ]),
        node("Politics", [
            node("Systems of government"),
            node("Social structure"),
        ]),
        node("Technologies", [
            node("Infrastructure"),
            node("Transport"),
            node("Communication"),
            node("Weapons & tools"),
        ]),
        node("Magic", [
            node("Magic types"),
            node("Restrictions"),
            node("Spells"),
        ]),
        node("Religion", [
            node("Deities"),
            node("Myths"),
            node("Legends"),
            node("Rituals"),
        ]),
        node("Culture", [node("Languages"), node("Art"), node("Fashion")]),
        node("Inhabitants", [node("Races"), node("Animals"), node("Plants")]),
    ];
}

export function makeNovel(title = "Untitled novel"): NovelRecord {
    const now = new Date().toISOString();
    return {
        id: crypto.randomUUID(),
        title,
        manuscript: "",
        createdAt: now,
        updatedAt: now,
        localRevision: 1,
        cloudRevision: 0,
        lastCloudHash: null,
        settings: {
            subtitle: "",
            author: "",
            genre: "",
            status: "idea",
            synopsis: "",
            targetWordCount: 80000,
            language: "English",
            coverDataUrl: null,
        },
        design: designDefaults(),
        characters: [],
        world: worldDefaults(),
        currencies: [],
        customModules: [],
        notes: [],
        timelineEvents: [],
        timelineLinks: [],
    };
}

export function makeManifest(): ManifestRecord {
    return {
        library: [],
        sharedEntities: [],
        themes: BUILTIN_THEMES,
        updatedAt: new Date().toISOString(),
        localRevision: 1,
        cloudRevision: 0,
        lastCloudHash: null,
        settings: {
            activeThemeId: "signal",
            backupMaxCount: 20,
            storageLimitMb: 0,
            googleDriveEnabled: false,
            editorFontSize: 18,
            editorLineHeight: 1.8,
            compactMode: false,
        },
    };
}
