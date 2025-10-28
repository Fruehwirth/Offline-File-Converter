# Dateiformat-Icons

Dieser Ordner enthält SVG-Icons für verschiedene Dateitypen.

## Verfügbare Icons

- `audio.svg` - Für Audiodateien (MP3, WAV, FLAC, OGG, AAC, M4A)
- `video.svg` - Für Videodateien
- `image.svg` - Für Bilddateien als Fallback (wenn kein Thumbnail verfügbar)
- `archive.svg` - Für Archivdateien (ZIP, RAR, 7Z, etc.)
- `document.svg` - Für Dokumente (PDF, DOCX, etc.)
- `file.svg` - Generisches Datei-Icon als Fallback

## Design-Richtlinien

Alle Icons sollten:

- **Größe**: 48x48 Pixel
- **Hintergrund**: Dunkelgrauer rechteckiger Block (`#4B5563`)
- **Border Radius**: 8px (abgerundete Ecken)
- **Icon-Farbe**: Weiß oder helle Farben
- **Stil**: Minimalistisch, wie App-Icons

## So ersetzen Sie die Placeholder-Icons

1. Öffnen Sie die entsprechende `.svg`-Datei
2. Ersetzen Sie den Inhalt mit Ihrem eigenen Design
3. Behalten Sie die grundlegende Struktur bei:
   - Viewport: `width="48" height="48" viewBox="0 0 48 48"`
   - Hintergrund-Rechteck: `<rect width="48" height="48" rx="8" fill="#4B5563"/>`
   - Ihre Icon-Grafik darüber

## Beispiel-Struktur

```svg
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Dunkler Hintergrund -->
  <rect width="48" height="48" rx="8" fill="#4B5563"/>

  <!-- Ihr Icon-Design hier -->
  <path d="..." fill="white"/>
</svg>
```
