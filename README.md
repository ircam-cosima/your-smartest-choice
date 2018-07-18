# Your Smartest Choice

Application for _Your Smartest Choice_ for violin, viola, harp, piano, electronic and smartphones composed by Huihui Cheng and created at the Eclat festival 2017 in Stuttgart.

## Installation

```
npm install
# ...then the server can be launched
npm run watch
```

## Production

To launch in production mode, run the following command:

```sh
sudo ENV=production node dist/server/index.js
```

_Note:_ the production mode uses minified files so if any logic or configuration changes has been made into the code, the following command should be run first:

```
npm run minify
```

## Midi Keyboard

To configure the midi keyboard, update the name of the device in the file `data/midi-config.json`, then restart the server when the keyboard is plugged

```
npm run watch
```

