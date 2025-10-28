# Icon-System für Dateitypen

## Überblick

Das Icon-System zeigt passende Icons für verschiedene Dateitypen an, wenn keine Vorschau verfügbar ist (z.B. für Audio-, Video-, Archiv- und Dokumentdateien).

## Struktur

### Icon-Dateien

Alle Icons befinden sich in: `src/assets/icons/`

- `audio.svg` - Audiodateien (MP3, WAV, FLAC, etc.)
- `video.svg` - Videodateien
- `image.svg` - Bilddateien (Fallback)
- `archive.svg` - Archivdateien (ZIP, RAR, 7Z, etc.)
- `document.svg` - Dokumente (PDF, DOCX, etc.)
- `file.svg` - Generisches Icon (Fallback)

### Komponenten

#### `FileTypeIcon.tsx`

Die Hauptkomponente, die das richtige Icon basierend auf dem Dateityp auswählt und anzeigt.

**Props:**

- `file: File` - Die Datei, für die das Icon angezeigt werden soll
- `className?: string` - Optionale CSS-Klassen

**Funktionen:**

- `getFileCategory(file: File): FileCategory` - Bestimmt die Kategorie basierend auf dem MIME-Typ
- `getCategoryIcon(category: FileCategory): string` - Gibt den Icon-Pfad für eine Kategorie zurück

#### `FileThumbnail` (in `FileList.tsx`)

Zeigt entweder ein Thumbnail (für Bilder/Videos) oder ein Dateitype-Icon an.

## Design-Richtlinien

### Icon-Spezifikationen

- **Größe**: 48x48 Pixel
- **Hintergrund**: Dunkelgrau (#4B5563)
- **Border Radius**: 8px (abgerundete Ecken)
- **Icon-Farbe**: Weiß (#FFFFFF)
- **Stil**: Minimalistisch, app-ähnlich

### SVG-Struktur

```svg
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Hintergrund -->
  <rect width="48" height="48" rx="8" fill="#4B5563"/>

  <!-- Icon-Design -->
  <path d="..." fill="white"/>
</svg>
```

## Eigene Icons hinzufügen

### Schritt 1: SVG-Datei erstellen

1. Erstellen Sie Ihr Icon mit den oben genannten Spezifikationen
2. Speichern Sie es als `.svg` in `src/assets/icons/`
3. Verwenden Sie einen beschreibenden Namen (z.B. `spreadsheet.svg`)

### Schritt 2: Icon-Typ hinzufügen

Erweitern Sie den `FileCategory`-Typ in `FileTypeIcon.tsx`:

```typescript
export type FileCategory =
  | 'audio'
  | 'video'
  | 'image'
  | 'archive'
  | 'document'
  | 'spreadsheet'
  | 'unknown'
```

### Schritt 3: Icon importieren

```typescript
import spreadsheetIcon from '../assets/icons/spreadsheet.svg'
```

### Schritt 4: Kategorie-Logik erweitern

Fügen Sie die Logik in `getFileCategory` hinzu:

```typescript
// Spreadsheet types
if (type.includes('spreadsheet') || type.includes('excel') || type.includes('sheet')) {
  return 'spreadsheet'
}
```

### Schritt 5: Icon zuordnen

Erweitern Sie `getCategoryIcon`:

```typescript
case 'spreadsheet':
  return spreadsheetIcon
```

## Placeholder ersetzen

### Aktuelle Placeholder

Alle Icons in `src/assets/icons/*.svg` sind einfache Placeholder mit grundlegenden Formen.

### So ersetzen Sie sie:

1. Öffnen Sie die entsprechende `.svg`-Datei
2. Behalten Sie die Viewport- und Hintergrund-Struktur bei:
   ```svg
   <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
     <rect width="48" height="48" rx="8" fill="#4B5563"/>
     <!-- Ihr Design hier -->
   </svg>
   ```
3. Ersetzen Sie den Inhalt innerhalb des `<svg>`-Tags
4. Speichern Sie die Datei

### Empfohlene Tools

- **Figma** - Für Vektordesign und SVG-Export
- **Inkscape** - Kostenlose Alternative
- **SVGOMG** - Zum Optimieren der SVG-Dateien

## Technische Details

### TypeScript-Unterstützung

Die Datei `src/types/svg.d.ts` ermöglicht den Import von SVG-Dateien als Module:

```typescript
declare module '*.svg' {
  const content: string
  export default content
}
```

### Vite-Integration

Vite behandelt SVG-Imports automatisch als Asset-URLs. Keine zusätzliche Konfiguration erforderlich.

### Verwendung in anderen Komponenten

```tsx
import { FileTypeIcon } from './FileTypeIcon'

function MyComponent({ file }: { file: File }) {
  return (
    <div className="w-12 h-12">
      <FileTypeIcon file={file} />
    </div>
  )
}
```

## Kategorien-Zuordnung

| Kategorie | MIME-Typen                                | Icon           |
| --------- | ----------------------------------------- | -------------- |
| Audio     | `audio/*`                                 | `audio.svg`    |
| Video     | `video/*`                                 | `video.svg`    |
| Image     | `image/*`                                 | `image.svg`    |
| Archive   | `*zip*`, `*rar*`, `*7z*`, `*tar*`, `*gz*` | `archive.svg`  |
| Document  | `*pdf*`, `*document*`, `*word*`, `*text*` | `document.svg` |
| Unknown   | Alle anderen                              | `file.svg`     |

## Best Practices

1. **Konsistenz**: Behalten Sie den visuellen Stil über alle Icons hinweg bei
2. **Simplizität**: Verwenden Sie klare, leicht erkennbare Formen
3. **Kontrast**: Achten Sie auf guten Kontrast zwischen Icon und Hintergrund
4. **Optimierung**: Optimieren Sie SVGs für kleinere Dateigrößen
5. **Accessibility**: Stellen Sie sicher, dass Icons auch ohne Farbe erkennbar sind

## Zukünftige Erweiterungen

Mögliche zusätzliche Kategorien:

- `code` - Für Programmiersprachen (JS, Python, etc.)
- `database` - Für Datenbankdateien (SQL, DB, etc.)
- `presentation` - Für Präsentationen (PPT, KEY, etc.)
- `font` - Für Schriftarten (TTF, OTF, etc.)
- `3d` - Für 3D-Modelle (OBJ, FBX, etc.)
