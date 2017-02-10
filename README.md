# Your smartest choice

Application for _Your smartest choice_ for violin, viola, harp, piano, electronic and smartphones composed by Huihui Cheng and created at the 2017 Eclat festival in Stuttgart.

## Installation

```
git clone 
npm install
# as the application is based on a development version of soundworks, 
# soundworks needs to be transpiled first
cd ./node_modules/soundworks
npm install
npm run transpile
cd ../..
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


