import fs from 'fs-extra';
import semver from 'semver';
import path from 'path';
import { CodeshiftConfig } from '@codeshift/types';

function getConfigFromPath(filePath: string): CodeshiftConfig {
  const configPath = path.join(process.cwd(), filePath, 'codeshift.config.js');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config = require(configPath);

  return !!config.default ? config.default : config;
}

function hasValidTransforms(transforms?: Record<string, string>) {
  if (!transforms || !Object.keys(transforms).length) return false;

  return Object.entries(transforms).every(([key]) => semver.valid(key));
}

function hasValidPresets(presets?: Record<string, string>): boolean {
  if (!presets || !Object.keys(presets).length) return false;

  return Object.entries(presets).every(([key]) =>
    key.match(/^[0-9a-zA-Z\-]+$/),
  );
}

export function isValidPackageName(dir: string): boolean {
  return !!dir.match(/^(@[a-z0-9-~][a-z0-9-._~]*__)?[a-z0-9-~][a-z0-9-._~]*$/);
}

export function isValidConfig(config: CodeshiftConfig) {
  return (
    hasValidTransforms(config.transforms) || hasValidPresets(config.presets)
  );
}

export function isValidConfigAtPath(filePath: string) {
  const config = getConfigFromPath(filePath);

  if (
    !hasValidTransforms(config.transforms) &&
    !hasValidPresets(config.presets)
  ) {
    throw new Error(
      `At least one transform should be specified for config at "${filePath}"`,
    );
  }

  if (!hasValidTransforms(config.transforms)) {
    throw new Error(`Invalid transform ids found for config at "${filePath}".
Please make sure all transforms are identified by a valid semver version. ie 10.0.0`);
  }

  if (!hasValidPresets(config.presets)) {
    throw new Error(`Invalid preset ids found for config at "${filePath}".
Please make sure all presets are kebab case and contain no spaces or special characters. ie sort-imports-by-scope`);
  }
}

export async function isValidPackageJson(path: string) {
  const packageJsonRaw = await fs.readFile(path + '/package.json', 'utf8');
  const packageJson = JSON.parse(packageJsonRaw);

  if (!packageJson.name) {
    throw new Error('No package name provided in package.json');
  }

  if (!packageJson.main) {
    throw new Error('No main entrypoint provided in package.json');
  }

  return true;
}
