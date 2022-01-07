#!/usr/bin/env node
/* eslint-disable */

/**
 * see also `codeshift-cli.js`
 */

const fs = require('fs');
const path = require('path');

const project = path.join(__dirname, "../../../../tsconfig.json");
const dev = fs.existsSync(project);
console.log({dev});

if (dev && !require.extensions['.ts']) {
  // ts-node can only handle being registered once, see https://github.com/TypeStrong/ts-node/issues/409
  require('ts-node').register({ project });
  console.log("registered ts-node");
}

try {
// community/@pipedrive__convention-ui-react/dist/5.0.0/transforms/postcss-replace-simple-variables/run-postcss-codemod.js
  const { runPostcssCodemod } = require(path.join(__dirname, dev ? 'runPostcssCodemod' : '../../../../dist/5.0.0/transforms/postcss-replace-simple-variables/runPostcssCodemod.js'))

    const argv = process.argv.splice(2);

    const dir = argv[0];
    if (!dir) {
        const msg = "run-postcss-codemod.js <path/to/dir/>";
        process.stderr.write(msg);
        process.exit(1);
    }

    runPostcssCodemod(dir);
} catch (error) {
  if (typeof error === 'number') {
    process.exit(error);
  }
  console.error(error);
  process.exit(1);
}
