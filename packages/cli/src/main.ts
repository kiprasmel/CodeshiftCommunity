import semver from 'semver';
import chalk from 'chalk';
import path from 'path';
import { PluginManager } from 'live-plugin-manager';
import merge from 'lodash/merge';
// @ts-ignore Run transform(s) on path https://github.com/facebook/jscodeshift/issues/398
import * as jscodeshift from 'jscodeshift/src/Runner';
import { isValidConfig } from '@codeshift/validator';
import {
  CodeshiftConfig, //
  DefaultRunner,
} from '@codeshift/types';

import { Flags } from './types';
import { InvalidUserInputError } from './errors';

async function fetchCommunityPackageConfig(
  packageName: string,
  packageManager: PluginManager,
) {
  const pkgName = packageName.replace('@', '').replace('/', '__');
  const commPackageName = `@codeshift/mod-${pkgName}`;

  await packageManager.install(commPackageName);
  const pkg = packageManager.require(commPackageName);
  const config: CodeshiftConfig = pkg.default ? pkg.default : pkg;

  if (!isValidConfig(config)) {
    throw new Error(`Invalid config found in module ${commPackageName}`);
  }

  return config;
}

async function fetchRemotePackageConfig(
  packageName: string,
  packageManager: PluginManager,
) {
  await packageManager.install(packageName);
  const pkg = packageManager.require(packageName);

  if (pkg) {
    const config: CodeshiftConfig = pkg.default ? pkg.default : pkg;

    if (config && isValidConfig(config)) {
      // Found a config at the main entry-point
      return config;
    }
  }

  const info = packageManager.getInfo(packageName);

  if (info) {
    let config: CodeshiftConfig | undefined;

    [
      path.join(info?.location, 'codeshift.config.js'),
      path.join(info?.location, 'codeshift.config.ts'),
      path.join(info?.location, 'src', 'codeshift.config.js'),
      path.join(info?.location, 'src', 'codeshift.config.ts'),
      path.join(info?.location, 'codemods', 'codeshift.config.js'),
      path.join(info?.location, 'codemods', 'codeshift.config.ts'),
    ].forEach(searchPath => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pkg = require(searchPath);
        const searchConfig: CodeshiftConfig = pkg.default ? pkg.default : pkg;

        if (isValidConfig(searchConfig)) {
          config = searchConfig;
        }
      } catch (e) {}
    });

    if (config) return config;
  }

  throw new Error(
    `Unable to locate a valid codeshift.config in package ${packageName}`,
  );
}

export default async function main(paths: string[], flags: Flags) {
  const packageManager = new PluginManager();
  let transforms: string[] = [];

  if (!flags.transform && !flags.packages) {
    throw new InvalidUserInputError(
      'No transform provided, please specify a transform with either the --transform or --packages flags',
    );
  }

  if (paths.length === 0) {
    throw new InvalidUserInputError(
      'No path provided, please specify which files your codemod should modify',
    );
  }

  if (flags.transform) {
    if (flags.transform.includes(',')) {
      flags.transform.split(',').forEach(t => transforms.push(t.trim()));
    } else {
      transforms.push(flags.transform);
    }
  }

  if (flags.packages) {
    const pkgs = flags.packages.split(',').filter(pkg => !!pkg);

    for (const pkg of pkgs) {
      const shouldPrependAtSymbol = pkg.startsWith('@') ? '@' : '';
      const pkgName =
        shouldPrependAtSymbol + pkg.split(/[@#]/).filter(str => !!str)[0];

      let communityConfig;
      let remoteConfig;

      console.log(chalk.green('Attempting to download package:'), pkgName);

      try {
        communityConfig = await fetchCommunityPackageConfig(
          pkgName,
          packageManager,
        );
      } catch (error) {}

      try {
        remoteConfig = await fetchRemotePackageConfig(pkgName, packageManager);
      } catch (error) {}

      if (!communityConfig && !remoteConfig) {
        throw new Error(
          `Unable to locate package from the codeshift-community packages or as a standalone NPM package.
Make sure the package name ${pkgName} has been spelled correctly and exists before trying again.`,
        );
      }

      const config: CodeshiftConfig = merge({}, communityConfig, remoteConfig);

      const rawTransformIds = pkg.split(/(?=[@#])/).filter(str => !!str);
      rawTransformIds.shift();

      const transformIds = rawTransformIds
        .filter(id => id.startsWith('@'))
        .map(id => id.substring(1))
        .sort((idA, idB) => {
          if (semver.lt(idA, idB)) return -1;
          if (semver.gt(idA, idB)) return 1;
          return 0;
        });

      const presetIds = rawTransformIds
        .filter(id => id.startsWith('#'))
        .map(id => id.substring(1));

      // Validate transforms/presets
      transformIds.forEach(id => {
        if (!semver.valid(semver.coerce(id.substring(1)))) {
          throw new InvalidUserInputError(
            `Invalid version provided to the --packages flag. Unable to resolve version "${id}" for package "${pkgName}". Please try: "[scope]/[package]@[version]" for example @mylib/mypackage@10.0.0`,
          );
        }

        if (!config.transforms || !config.transforms[id]) {
          throw new InvalidUserInputError(
            `Invalid version provided to the --packages flag. Unable to resolve version "${id}" for package "${pkgName}"`,
          );
        }
      });

      presetIds.forEach(id => {
        if (!config.presets || !config.presets[id]) {
          throw new InvalidUserInputError(
            `Invalid preset provided to the --packages flag. Unable to resolve preset "${id}" for package "${pkgName}"`,
          );
        }
      });

      // Get transform file paths
      if (config.transforms) {
        if (flags.sequence) {
          Object.entries(config.transforms as Record<string, string>)
            .filter(([key]) => semver.satisfies(key, `>=${transformIds[0]}`))
            .forEach(([, path]) => transforms.push(path));
        } else {
          Object.entries(config.transforms as Record<string, string>).forEach(
            ([id, path]) => {
              if (transformIds.includes(id)) {
                transforms.push(path);
              }
            },
          );
        }
      }

      // Get preset file paths
      if (config.presets) {
        Object.entries(config.presets as Record<string, string>).forEach(
          ([id, path]) => {
            if (presetIds.includes(id)) {
              transforms.push(path);
            }
          },
        );
      }
    }
  }

  if (!transforms.length) {
    throw new InvalidUserInputError(
      'Unable to locate transforms from provided flags.',
    );
  }

  // Dedupe transform array
  transforms = transforms.filter(
    (transform, i) => transforms.indexOf(transform) === i,
  );

  for (const transform of transforms) {
    const resolvedTransformPath = path.resolve(transform);
    console.log(chalk.green('Running transform:'), resolvedTransformPath);

    const defaultRunner: DefaultRunner = (
      jscodeshiftOptionOverrides = {},
      pathsToModify = paths,
      /**
       * ideally you'd be able to pass in either the path,
       * or the actual transform,
       * but jscodeshift doesn't allow this (unless we fork?)
       */
      transformerPath: string = resolvedTransformPath,
      /**
       * i think the jscodeshift.run is synchronous
       * so the promise is not needed,
       * but if we want to change it in the future,
       * making it's return type a promise will help
       * to avoid breaking changes for consumers who
       * use the defaultRunner.
       */
    ): Promise<void> =>
      jscodeshift.run(transformerPath, pathsToModify, {
        verbose: 0,
        dry: flags.dry,
        print: true,
        babel: true,
        extensions: flags.extensions,
        ignorePattern: flags.ignorePattern,
        cpus: flags.cpus,
        ignoreConfig: [],
        runInBand: flags.runInBand,
        silent: false,
        parser: flags.parser,
        stdin: false,
        ...jscodeshiftOptionOverrides,
      });

    let transformImported: any;
    try {
      /**
       * TODO MAINTAINER -- i am not confident that this will work
       * if the transform was provided thru an npm package.
       */

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      transformImported = require(resolvedTransformPath);
    } catch (_e) {}

    const transformHasCustomRunner = (
      ti: any,
    ): ti is {
      /**
       * ideally, `default` would be the type of the transformer,
       * which would be identical to the type of the argument to
       * `CustomTransformerConfig`,
       *
       * but unless we put the transformer itself into the config,
       * we cannot ensure that the type is correct.
       *
       */
      default: unknown; //
      codeshiftConfig: CodeshiftConfig<unknown>;
    } => {
      if (ti && 'codeshiftConfig' in ti) {
        return 'runner' in transformImported['codeshiftConfig'];
      }
      return false;
    };

    if (transformHasCustomRunner(transformImported)) {
      console.info(
        '\nusing CUSTOM runner for transform',
        resolvedTransformPath,
      );

      await transformImported.codeshiftConfig.runner({
        pathsToModify: paths,
        defaultRunner,
        /**
         * providing the `transform`, `resolvedTransformPath`, etc. here
         * is quite useless, because it's file-based,
         * so in whichever file the config is in,
         * that default export will be the transform,
         * and the file's path will be the resolved path.
         *
         * ...unless you have a custom runner defined in a separate file,
         * and want it to be able to access the transform,
         * esp. if that runner does not take in a path,
         * but rather the transform function.
         */
        transformInsideFileThatSpecifiesCodeshiftConfig:
          transformImported.default,
        // resolvedTransformPath
      });
    } else {
      console.info(
        '\nusing DEFAULT runner for transform',
        resolvedTransformPath,
      );

      defaultRunner();
    }
  }

  await packageManager.uninstallAll();
}
