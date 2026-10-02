import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@xyflow/react/dist/style.css";
import "./styles.css";
import { DumkohrayProvider } from "./components/dumkohray-provider";
import { LibraryPage } from "./components/library-page";
import { NovelWorkspace } from "./components/novel-workspace";
import { SettingsPanel } from "./components/settings-panel";
import { useRoute } from "./lib/router";

function App() {
    const route = useRoute();
    if (route === "/settings") return <SettingsPanel />;
    const m = route.match(/^\/novel\/([^/]+)$/);
    if (m) return <NovelWorkspace id={decodeURIComponent(m[1])} />;
    return <LibraryPage />;
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <DumkohrayProvider>
            <App />
        </DumkohrayProvider>
    </StrictMode>,
);
