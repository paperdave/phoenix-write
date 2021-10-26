# phoenix write!

i don't apologize for the horid code

lil explainer
- yes, its a svelte-kit website.
- variable and file names are god shit tier. some names are just set up as a joke to be stupid confusing.
- `static/maps` holds the maps (cutscense and levels)
- main level code is split among `input.ts`, main level visuals in `_Level.svelte`
- cutscene code with all edge cases entirely contained in `_Cutscene.svelte`
- the duet is made from copy pasting the regular game and thus is highly hardcoded, see `_Duet.svelte` and `duet_fork.ts`
- a custom map format exists, parsing is in map-parser.ts
- see `types.ts` for all the types for the meta.json, cutscene.json, and flags object (the json at the end of each line in map.txt)
- "builtversion" is a separate vite project since SvelteKit doesnt play well with itch io. this is what the build is from, and SK is used just for development
- in development mode, `maps.json` is provided via an api endpoint `maps.json.ts` and in production its baked using `generatefinal.mjs`
- i think `_Container.svelte` and the css `--unit` variable is really cool. it makes the game feel more like a real game by forcing a 16:9 aspect ratio and then making --unit equal to 1/100 of the game frame's width. everything from position to font size to letter spacing is written in terms of --unit, so the game scales to any screen.

commands
- dev with `yarn dev`
- build with `./BUILD.ps1`, but when it says press enter to continue, you have to first do this
  - from build move cursor, cursor-red, carlito-bold, alfaslabone-regular, all into the build/assets folder
  - manually make the paths in index.html relative, add a . so its ./assets
  - then press enter, makes a zip for itchio

