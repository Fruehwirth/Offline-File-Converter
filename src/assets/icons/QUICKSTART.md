# Schnellstart: Icons ersetzen

## 🎯 Ziel

Ersetzen Sie die Placeholder-Icons mit Ihren eigenen SVG-Designs.

## 📁 Dateien

Alle Icons befinden sich in diesem Ordner (`src/assets/icons/`):

```
audio.svg       → Audiodateien (MP3, WAV, etc.)
video.svg       → Videodateien
image.svg       → Bilderdateien (Fallback)
archive.svg     → Archive (ZIP, RAR, etc.)
document.svg    → Dokumente (PDF, DOCX, etc.)
file.svg        → Generisches Icon (Fallback)
```

## ✏️ So ersetzen Sie ein Icon

### 1. Icon-Datei öffnen

Öffnen Sie z.B. `audio.svg` in einem Texteditor.

### 2. Struktur beibehalten

Behalten Sie diese Grundstruktur bei:

```svg
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Dunkelgrauer Hintergrund mit abgerundeten Ecken -->
  <rect width="48" height="48" rx="8" fill="#4B5563"/>

  <!-- IHR DESIGN HIER -->
  <path d="..." fill="white"/>
</svg>
```

### 3. Design einfügen

Ersetzen Sie alles **nach** dem `<rect>`-Element mit Ihrem eigenen SVG-Design.

### 4. Speichern

Speichern Sie die Datei. Die Änderungen werden automatisch in der App übernommen.

## 🎨 Design-Regeln

- **Größe**: 48x48 Pixel
- **Hintergrund**: `#4B5563` (Dunkelgrau)
- **Border Radius**: 8px
- **Icon-Farbe**: Weiß oder helle Farben
- **Stil**: Minimalistisch, wie App-Icons

## 👀 Vorschau

Öffnen Sie `preview.html` in Ihrem Browser, um alle Icons zu sehen:

```bash
# Windows
start src/assets/icons/preview.html

# Mac
open src/assets/icons/preview.html

# Linux
xdg-open src/assets/icons/preview.html
```

## 🔍 Beispiel: Audio-Icon ersetzen

**Vorher** (Placeholder):

```svg
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" rx="8" fill="#4B5563"/>
  <!-- Einfaches Placeholder-Icon -->
  <path d="M18 34c-1.657..." fill="white"/>
</svg>
```

**Nachher** (Ihr Design):

```svg
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" rx="8" fill="#4B5563"/>
  <!-- Ihr eigenes Icon-Design -->
  <path d="M24 12c-6.627 0-12 5.373-12 12s5.373 12 12 12..." fill="white"/>
  <circle cx="24" cy="24" r="4" fill="white"/>
</svg>
```

## 🛠️ Empfohlene Tools

- **Figma** - Professionelles Design-Tool (kostenlos für Einsteiger)
- **Inkscape** - Kostenlose Open-Source-Alternative
- **SVGOMG** - Online-Tool zum Optimieren von SVGs

## 💡 Tipps

1. **Konsistenz**: Verwenden Sie den gleichen Stil für alle Icons
2. **Einfachheit**: Weniger Details = bessere Erkennbarkeit
3. **Kontrast**: Achten Sie auf guten Kontrast zum Hintergrund
4. **Test**: Testen Sie Icons in verschiedenen Größen

## 📚 Weitere Infos

- Vollständige Dokumentation: siehe `README.md` in diesem Ordner
- System-Dokumentation: siehe `ICON_SYSTEM.md` im Projekt-Root
