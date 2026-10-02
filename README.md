# Dumkohray

Dumkohray is a **local-first novel writing, planning, and worldbuilding studio**. The application is a static React app: there is no Next.js server, no Neon database, and no required account.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS · IndexedDB · optional Google Drive · React Flow

## How storage works

Dumkohray always works locally first.

- Typing and structural edits are automatically persisted to browser **IndexedDB**.
- **Ctrl/Cmd + S** creates a local recovery checkpoint. It never uses the network.
- **Ctrl/Cmd + Shift + S** opens the named cloud-save dialog **only when Google Drive is connected**.
- Google Drive is optional. If you never connect it, Dumkohray remains a fully local application on that browser/device, but you do **not** get cloud backup or cross-device restore.

> Browser storage belongs to that browser profile/device. If you use local-only mode, export/backup your browser profile appropriately. Clearing site data can delete IndexedDB data.

## Google Drive cloud saves

Cloud saves are explicit snapshots, not continuous synchronization. This makes cross-device behavior predictable and prevents silent overwrites.

When you press **Ctrl/Cmd + Shift + S**:

1. Dumkohray creates a local checkpoint.
2. It asks for a **save name** and an optional **comment**.
3. It uploads one complete Dumkohray snapshot to the `Dumkohray Backups` folder in the connected Google Drive.
4. The snapshot records the Dumkohray app version that created it.
5. On another device, connect the same Google account, open Settings → Google Drive, and choose the snapshot you want to **Load**. Saves are shown newest first by name, time, version, size, and comment.

The backup limit is configurable in Settings. If creating a new cloud save would exceed the limit, Dumkohray asks whether to delete the oldest Drive backup. If you decline, Dumkohray keeps it and automatically raises the configured limit instead.

Dumkohray uses Google's narrow `drive.file` permission. It creates and manages its own backup folder/files rather than requesting unrestricted access to every file in Drive.

## Google Drive storage display

When connected, Settings queries Google Drive's storage quota and shows:

- total account storage used,
- estimated free storage when Google provides a quota limit,
- number of Dumkohray cloud saves,
- local Dumkohray payload size.

The Drive figure is the account-level quota reported by Google, not a made-up Dumkohray/Neon capacity.

## Features

- folder-like library for series and novels,
- deletion and renaming of folders/series and novels,
- novel manuscript editor with local autosave,
- design-document trees,
- recursive/customizable character fields,
- galleries and relationships,
- cross-novel shared identities,
- relationship graph,
- recursive worldbuilding tree,
- currencies and conversion rates,
- blueprint-style timeline,
- tagged notes,
- custom top-level modules,
- novel cover and metadata,
- local checkpoint history,
- optional named Google Drive cloud snapshots,
- theme editor with template chooser modal,
- no rounded UI chrome,
- static GitHub Pages deployment.

## Theme creation

Open **Settings → Themes** and press **+ Theme**. A floating template window appears. You can start from:

- Blank / all black,
- Signal,
- Paper,
- Monolith,
- any custom theme you already created.

After creation, every palette color can be edited independently.

## Development

Requirements:

- Node.js 24 or newer recommended
- npm

```bash
npm install
npm run dev
```

Build the static application:

```bash
npm run build
```

The deployable site is written to `dist/`.

## Optional Google Drive setup

Local-only development needs no environment variables.

To enable Google Drive:

1. Create a project in Google Cloud Console.
2. Enable **Google Drive API**.
3. Configure the Google Auth Platform / OAuth consent screen.
4. Create an OAuth client with application type **Web application**.
5. Add your development origin, normally:

   ```text
   http://localhost:5173
   ```

6. Copy the OAuth Client ID into `.env.local`:

   ```env
   VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
   ```

7. Restart `npm run dev`.

A web OAuth **client ID is not a password/secret**. It identifies the browser application. Never put a Google client secret in this frontend.

## Deploy on GitHub Pages

The repository contains `.github/workflows/deploy-pages.yml`.

### 1. Push the repository to GitHub

Create a repository, for example `dumkohray`, and push this project to its `main` branch.

### 2. Enable Pages

In GitHub:

**Repository → Settings → Pages → Build and deployment → Source → GitHub Actions**

### 3. Deploy local-only Dumkohray

If you do not want Google Drive, that is all you need. Push to `main`; GitHub Actions builds and publishes the app.

Your URL will normally be:

```text
https://YOUR-USERNAME.github.io/dumkohray/
```

Everyone can open that same URL. Each person's data stays in their own browser IndexedDB.

### 4. Enable Google Drive for the public site

In the Google OAuth Web Client, add this **Authorized JavaScript origin**:

```text
https://YOUR-USERNAME.github.io
```

Authorized origins contain only scheme + host; do not append `/dumkohray/`.

Then in GitHub add a repository Actions secret:

**Settings → Secrets and variables → Actions → New repository secret**

Name:

```text
VITE_GOOGLE_CLIENT_ID
```

Value:

```text
YOUR_CLIENT_ID.apps.googleusercontent.com
```

Run the Pages workflow again (or push a commit).

If you use a custom domain, also add that origin to the Google OAuth client.

### 5. Make Drive connection available to everyone

During Google OAuth development/testing, access may be limited to configured test users. Before offering Dumkohray publicly, configure/publish the Google Auth application appropriately for external users and follow Google's current verification/branding requirements.

Users still do not need GitHub, a clone, Neon, Vercel, or their own Google Cloud project. They simply open your published Dumkohray URL and optionally click **Connect Google Drive**.

## GitHub Pages routing

Dumkohray uses hash routes (`#/settings`, `#/novel/...`) so refreshing a nested screen works reliably on static GitHub Pages without server rewrite rules.

## Dependency policy

The project intentionally keeps dependencies small. React Flow is used for graph/timeline canvases; the rest of the interface is custom React/CSS. Runtime and development packages are pinned to contemporary stable major releases in this starter.

## TypeScript note

The requested Next-generated include is kept manually in the TypeScript configurations:

```json
".next/dev/types/**/*.ts"
```

Dumkohray no longer uses Next.js, so that path normally matches nothing. It remains harmless and can be removed later if backward compatibility with the previous project layout is no longer relevant.

## License

Dumkohray uses the included **Dumkohray Source-Available License v1.0**. It allows viewing, use, private modification, and contributions, but prohibits redistribution/repackaging under the terms described in `LICENSE`.

Because redistribution is restricted, this is source-available software rather than OSI-defined open source.
