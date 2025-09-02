# Pralinen-Bewertungs-App

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

## 🗄️ Datenmodell

### Year (Jahr)
```sql
- Jahr wird direkt als INTEGER verwendet (2024, 2025, etc.)
- Keine separate Year-Tabelle, Jahr wird in anderen Tabellen referenziert
- Validierung: Jahr muss > 2020 und <= 2050 sein
```

### Person
```sql
- id: INTEGER PRIMARY KEY
- first_name: TEXT NOT NULL
- last_name: TEXT NOT NULL
- created_at: DATETIME
- updated_at: DATETIME
```

### PersonYear (Through-Model)
```sql
- id: INTEGER PRIMARY KEY
- person_id: INTEGER NOT NULL → Person.id
- year: INTEGER NOT NULL (direktes Jahr, nicht Foreign Key)
- signature: TEXT NOT NULL (6 Zeichen alphanumerisch, unique pro Jahr)
- is_participating: BOOLEAN NOT NULL DEFAULT false
- favorite_chocolate_id: INTEGER → Praline.id (nullable)
- general_feedback: TEXT (nullable)
- allergies: TEXT (nullable)
- created_at: DATETIME
- updated_at: DATETIME

UNIQUE(person_id, year)
UNIQUE(signature, year)
```

### Praline
```sql
- id: INTEGER PRIMARY KEY
- year: INTEGER NOT NULL (direktes Jahr, nicht Foreign Key)
- name: TEXT NOT NULL
- image_path: TEXT NOT NULL (Pfad zu R2 Storage)
- is_vegan: BOOLEAN NOT NULL DEFAULT false
- description: TEXT (nullable)
- created_at: DATETIME
- updated_at: DATETIME
```

### Rating
```sql
- id: INTEGER PRIMARY KEY
- person_year_id: INTEGER NOT NULL → PersonYear.id
- praline_id: INTEGER NOT NULL → Praline.id
- rating: INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5)
- comment: TEXT (nullable)
- created_at: DATETIME
- updated_at: DATETIME

UNIQUE(person_year_id, praline_id)
```

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

## 📱 Seiten-Struktur

### Admin Panel (Auth erforderlich)
```
/admin/
├── dashboard/              # Übersicht, aktuelles Jahr
├── persons/               # Personen-Verwaltung (CRUD)
├── years/                 # Jahr-Verwaltung
├── years/:id/             # Jahr-Detail: Teilnehmer + Pralinen
└── ratings/:yearId/       # Bewertungen anzeigen + Export
```

### Öffentliche Seiten
```
/                          # Landing Page
/rate/:signature          # Bewertungsseite für Person/Jahr
```

## 🎨 User Experience

### Admin Workflow
1. **Jahr anlegen**: Neues Jahr erstellen (z.B. "Pralinen 2024")
2. **Pralinen hinzufügen**: Name, Bild, Beschreibung, vegan ja/nein
3. **Teilnehmer auswählen**: Aus bestehenden Personen wählen oder neue anlegen
4. **Signaturen generieren**: System erstellt automatisch 6-stellige Codes
5. **Links/QR-Codes**: Automatische Generierung für Versand
6. **Bewertungen verfolgen**: Echtzeit-Übersicht über eingegangene Bewertungen

### Teilnehmer Workflow
1. **QR-Code scannen** oder Link öffnen (`/rate/:signature`)
2. **Bewertungsseite öffnen**:
   - Übersicht aller Pralinen des Jahres
   - Fortschrittsbalken (z.B. "3 von 7 bewertet")
   - Bestehende Bewertungen werden angezeigt
3. **Praline bewerten**:
   - Klick auf Praline öffnet Modal
   - 1-5 Sterne Bewertung (Pflicht)
   - Optionaler Kommentar
   - Speichern schließt Modal, aktualisiert Übersicht
4. **Generelle Angaben** (unten auf derselben Seite):
   - Lieblingspraline (Dropdown mit bewerteten Pralinen)
   - Generelles Feedback (Textarea)
   - Allergien/Unverträglichkeiten (Textarea)
5. **Jederzeit änderbar**: Erneuter Besuch lädt alle vorherigen Antworten

### UI/UX Anforderungen
- **Single Page Experience**: Alles auf einer Seite, Modal für Details
- **Mobile First**: Optimiert für Smartphone-Nutzung
- **Intuitive Navigation**: Klare Fortschrittsanzeige
- **Persistent State**: Automatisches Speichern bei jeder Änderung
- **Visual Feedback**: Bewertete Pralinen deutlich markiert

## 🔐 Sicherheit & Zugriff

### Admin-Bereich
- **Authentication**: GitHub OAuth
- **Authorization**: Nur authentifizierte Benutzer
- **CRUD Operations**: Vollzugriff auf alle Daten

### Öffentlicher Bereich
- **Signatur-basiert**: 6-stellige alphanumerische Codes
- **Jahres-spezifisch**: Signatur nur für ein Jahr gültig
- **Keine Registrierung**: Direkter Zugang über Link
- **Rate Limiting**: Schutz vor Missbrauch

## 📊 Daten-Features

### Bewertungs-Logik
- **Rating Range**: 1-5 Sterne pro Praline
- **Optional Comments**: Zusätzliche Textbewertung
- **Favorite Selection**: Eine Lieblingspraline pro Person
- **Progress Tracking**: Automatische Fortschrittsberechnung

### Admin-Funktionen
- **Bewertungs-Export**: CSV/JSON Export aller Bewertungen
- **Teilnehmer-Status**: Übersicht wer bereits bewertet hat
- **Statistiken**: Durchschnittsbewertungen, beliebteste Pralinen
- **QR-Code Generation**: Zum Ausdrucken und Versenden

## 🚀 Deployment

### Cloudflare Integration
- **Pages**: Automatisches Deployment via Git
- **D1**: Serverless SQLite Datenbank
- **R2**: Objektspeicher für Bilder
- **Workers**: Serverless Functions über NuxtHub

### Environment Variables
```env
NUXT_OAUTH_GITHUB_CLIENT_ID=
NUXT_OAUTH_GITHUB_CLIENT_SECRET=
NUXT_HUB_DATABASE_URL=
NUXT_HUB_BLOB_SERVING_URL=
```

## 📝 Entwicklungs-Prioritäten

### MVP (Phase 1)
1. Datenmodell & Database Setup
2. Admin Authentication & Panel
3. Personen- und Jahres-Verwaltung
4. Pralinen-Upload & Management
5. Öffentliche Bewertungsseite
6. Rating-System mit Modal

### Phase 2
1. QR-Code Generierung
2. Export-Funktionalität
3. Statistiken & Analytics
4. UI/UX Verbesserungen
5. Mobile Optimierung

## 🎯 Success Criteria

- Admins können in unter 30 Minuten ein neues Jahr mit Pralinen anlegen
- Teilnehmer können alle Pralinen in unter 5 Minuten bewerten
- System ist über mehrere Jahre stabil und erweiterbar
- Bewertungen sind persistent und jederzeit änderbar
- QR-Codes funktionieren zuverlässig auf allen gängigen Smartphones