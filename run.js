#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * a temporary utility to run local codemods quickly
 * before we improve stuff upstream.
 */

const helpMsg = `
run.js parser=flow codemodsToRun fileOrDirectoryToModify extensions="js,jsx,ts,tsx"

codemodsToRun - paths to codemods which have a codeshift.config.js file.
                separated by spaces.
                can also just provide keys from the "shorthands.json" file

examples:

./run.js flow ./community/@pipedrive__convention-ui-react/src/5.0.0/transform.ts ~/projects/some-project-which-uses-cui4/src/
./run.js flow cui5                                                               ~/projects/some-project-which-uses-cui4/src/ # cui5 is from shorthands.json

`;

const path = require('path');
const cp = require('child_process');

const peekNextArg = () => process.argv[0];
const eatNextArg = () => process.argv.shift();

const shouldPrintHelp = () => (
  (should =
    !process.argv.length ||
    ['-h', '--help', '-help', 'help'].includes(peekNextArg())),
  should && console.log(helpMsg),
  should
);

const parseArgv = () => (
  process.argv.splice(0, 2),
  shouldPrintHelp() && process.exit(1),
  {
    parser: eatNextArg() || 'flow',
    transformsToRun: parseArrayFromCsv(eatNextArg() || ''),
    fileOrDirectoryToModify: eatNextArg() || '',
    extensions: eatNextArg() || 'js,jsx,ts,tsx',
  }
);

/**
 * will pipe stdio as if we were running the command ourselves!
 *
 * see https://stackoverflow.com/a/47338488/9285308
 *
 * usage:
 *
 * ```js
 * const command = "ls -la";
 * require("child_process").execSync(command, { ...pipeStdioOpts() });
 * ```
 *
 */
const pipeStdioOpts = (cwd = process.cwd()) => ({ cwd, stdio: 'inherit' });
const execSyncP = (cmd, opts) =>
  cp.execSync(cmd, { ...opts, ...pipeStdioOpts() });

run();

function run() {
  process.on('SIGTERM', () => process.exit(1));

  if (!!process.env.OLD_FULL_REBUILD) {
    execSyncP('yarn clean');
    execSyncP('yarn install');
    execSyncP('yarn types:check');
  }

  let {
    parser, //
    transformsToRun,
    fileOrDirectoryToModify,
    extensions,
  } = parseArgv();

  const shorthands = require(path.join(__dirname, './shorthands.json'));
  console.log({ shorthands });

  transformsToRun = transformsToRun
    .map(t => {
      if (t in shorthands) {
        return resolveTransformsFromShorthand(shorthands[t]);
      } else {
        if (!!process.env.OLD_FULL_REBUILD) {
          const dir = path.dirname(t);
          const cmd = `yarn --cwd ${dir} build`;
          console.log('transform to run, build cmd', { cmd });
          execSyncP(cmd);
        }
        return t;
      }
    })
    .flat()
    .join(',');

  const cliPath = path.join(__dirname, './packages/cli/bin/codeshift-cli.js');

  const cmdToExec = `${cliPath} --parser ${parser} -e ${extensions} -t ${transformsToRun} ${fileOrDirectoryToModify}`;
  console.log({ cmdToExec });

  execSyncP(cmdToExec);
}

function parseArrayFromCsv(csv = '') {
  return csv
    .split(',')
    .filter(c => !!c)
    .map(c => c.trim())
    .filter(c => !!c);
}

function resolveTransformsFromShorthand([
  relPathToCodemodPkg,
  transformVersion,
]) {
  const pathToCodemodPkg = path.join(__dirname, relPathToCodemodPkg);

  if (!!process.env.OLD_FULL_REBUILD) {
    execSyncP(`yarn --cwd ${pathToCodemodPkg} build`);
    console.log('built');
  }

  const pathToCodemodConfig = path.join(
    pathToCodemodPkg,
    // 'dist',
    'src',
    'codeshift.config.js',
  );

  const codemodCfg = require(pathToCodemodConfig);
  console.log({ pathToCodemodConfig, codemodCfg, __dirname });

  const { transforms } = codemodCfg;

  const transformsApplicable = Object.entries(transforms)
    .map(([version, relPathToTransform]) => {
      if (version === transformVersion) {
        // return relPathToTransform;
        // return path.join(pathToCodemodPkg, 'dist', relPathToTransform); // TODO must ensure it's compiled / run with ts-node / require from 'dist'

        return path.join(pathToCodemodPkg, 'src', relPathToTransform);
      }
    })
    .filter(x => !!x);

  return transformsApplicable;
}
