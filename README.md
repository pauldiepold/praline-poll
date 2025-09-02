# Pralinen-Bewertungs-App 🍫

Eine Web-Anwendung zur jährlichen Bewertung selbstgemachter Pralinen durch ausgewählte Personen.

## 🎯 Projektübersicht

### Kernidee
- Jedes Jahr werden Pralinen gebacken und an Freunde verschickt
- Jede Person erhält 4-7 Pralinen pro Jahr
- Über QR-Code/Link gelangen sie zur Bewertungs-App
- Admins verwalten alles, andere nutzen öffentliche Seiten mit Signatur-URLs

### Hauptfunktionen
- Admin-Panel zur Verwaltung von Personen, Jahren und Pralinen
- Öffentliche Bewertungsseiten mit eindeutigen Signaturen
- Einzelbewertung von Pralinen (1-5 Sterne) + generelles Feedback
- Automatische QR-Code/Link-Generierung
- Persistente Datenspeicherung über Jahre hinweg

## 🔧 Tech Stack

### Core Framework
- **Nuxt 3** mit NuxtHub
- **Deployment**: Cloudflare Pages
- **Database**: Cloudflare D1 (SQLite)
- **File Storage**: Cloudflare R2 Bucket für Pralinbilder
- **Authentication**: OAuth mit GitHub (nur für Admins)

### Frontend
- **Styling**: Tailwind CSS + NuxtUI
- **Language**: Deutsch (einsprachig)
- **Responsive**: Mobile-first Design
- **Images**: Automatische Optimierung über Nuxt

### Features
- **Image Upload**: Drag & Drop für Pralinbilder
- **QR Code Generation**: Automatisch für jede Person/Jahr Kombination
- **Form Handling**: Reactive Forms mit Validierung
- **Modal System**: Für Pralin-Bewertung

## 📋 Detaillierte Anforderungen

Alle detaillierten Anforderungen, Datenmodelle und Spezifikationen findest du in der [requirements.md](./requirements.md).

## 🚀 Setup

### Abhängigkeiten installieren

```bash
pnpm i
```

### GitHub OAuth konfigurieren

Erstelle eine [GitHub OAuth Application](https://github.com/settings/applications/new) mit:
- Homepage URL: `http://localhost:3000`
- Callback URL: `http://localhost:3000/api/auth/github`

Füge die Variablen in der `.env` Datei hinzu:

```bash
NUXT_OAUTH_GITHUB_CLIENT_ID="deine-github-oauth-app-id"
NUXT_OAUTH_GITHUB_CLIENT_SECRET="dein-github-oauth-app-secret"
```

### Session-Verschlüsselung

Für verschlüsselte Sessions benötigst du `NUXT_SESSION_PASSWORD` in der `.env` mit mindestens 32 Zeichen:

```bash
NUXT_SESSION_PASSWORD="dein-super-langer-geheimer-schlüssel-für-session-verschlüsselung"
```

## 🛠️ Entwicklung

Starte den Entwicklungsserver auf http://localhost:3000:

```bash
npm run dev
```

### Datenbank-Migrationen

Generiere neue Datenbank-Migrationen:

```bash
pnpm db:generate
```

## 🚀 Deployment

### NuxtHub (Empfohlen)

Du kannst dieses Projekt kostenlos und ohne Konfiguration auf deinem Cloudflare-Account mit [NuxtHub](https://hub.nuxt.com) deployen:

```bash
npx nuxthub deploy
```

### Cloudflare Pages CI

Es ist auch möglich, Cloudflare Pages CI für das Deployment zu nutzen. Erfahre mehr über die verschiedenen Optionen auf https://hub.nuxt.com/docs/getting-started/deploy

## 🌐 Remote Storage

Sobald du dein Projekt deployed hast, kannst du dich mit deiner Remote-Datenbank verbinden:

```bash
pnpm dev --remote
```

Erfahre mehr über Remote Storage auf https://hub.nuxt.com/docs/getting-started/remote-storage

## 📱 Features

- **Server-Side Rendering on the Edge** mit Nuxt
- **Authentication** über nuxt-auth-utils
- **Cloudflare D1** als Datenbank mit Drizzle ORM
- **Automatische Datenbank-Migrationen** in der Entwicklung & beim Deployment
- **Nuxt UI** für die Benutzeroberfläche
- **Drizzle Studio** in den Nuxt DevTools eingebettet
- **Cache-Invalidierung** und Optimistic UI mit Pinia Colada

## 📄 Lizenz

[MIT License](./LICENSE)
