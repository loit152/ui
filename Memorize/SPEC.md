# Element Memory Specification

## Directory

Index.html
Style.css

Js/
- app.js
- storage.js

Mode-Data/
- number-to-name.js
- number-to-symbol.js
- symbol-to-number.js
- symbol-to-name.js

## Design principle

`app.js` is the generic quiz engine.
`storage.js` handles persistence.
Each file under `Mode-Data` is an independent mode definition and owns its mode data.

A new mode should normally require:
1. Creating one file under `Mode-Data`.
2. Registering that file with one `<script>` line in `Index.html`.
3. No modification to `app.js`.

## Mode interface

Each mode registers an object with:

- `id`: unique string
- `title`: UI label
- `questionLabel`: label above the question
- `data`: array of question records
- `normalizeAnswer(answer)`: answer normalization function

Each `data` record contains at least:

- `question`
- `answer`

It may also contain metadata such as:

- `number`
- `symbol`
- `name`

## Mastery

Mastery is stored as:

`mastery[mode.id][dataIndex]`

Range: 0–100.

Correct: +10.
Wrong: -20.
Both are clamped to 0–100.

Lower mastery gives a higher probability of being selected.

## Persistence

Cookie name: `elementMemory`.

Saved state contains:

- `version`
- `mastery`
- `currentMode`
- `rangeStart`
- `rangeEnd`
