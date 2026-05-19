# Gibson Calculator

Desktop Gibson Assembly calculator for planning DNA fragment volumes before adding Gibson Assembly Mix.

## Features

- Required backbone and insert length plus concentration inputs.
- Molar calculation from the dsDNA shortcut:

  ```text
  pmol/µL = concentration / (length × 0.65)
  ```

- Default 2.5 µL DNA fragment volume plus 7.5 µL Gibson mix.
- Editable insert excess ratio, default 3.0x total backbone pmol.
- Multiple backbones and inserts.
- Highlighted pipetting table.
- Inline validation and pipetting warnings below 0.5 µL.
- Compact one-page print/PDF worksheet for protocol books.

## Development

Install dependencies:

```bash
npm install
```

Run the desktop app in development:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Build the app:

```bash
npm run build
```

Create a macOS DMG:

```bash
npm run dist:mac
```

Create a Windows x64 installer:

```bash
npm run dist:win
```

Create a Windows ARM64 installer:

```bash
npm run dist:win:arm64
```

## Sharing With Labmates

The generated app is standalone; labmates do not need Node, npm, or Python installed.

Unsigned macOS and Windows builds may show security warnings when copied between computers. For routine lab sharing this is usually manageable, but wider distribution should use code signing and macOS notarization.
