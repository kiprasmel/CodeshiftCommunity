import fs from 'fs-extra';
import path from 'path';
import semver from 'semver';
import * as recast from 'recast';
import { version as utilVersion } from '@codeshift/utils/package.json';
import { version as testUtilVersion } from '@codeshift/test-utils/package.json';

export function getPackageJson(packageName: string, version: string = '0.0.0') {
  return JSON.stringify(
    {
      name: packageName,
      version: version,
      license: 'MIT',
      main: 'dist/codeshift.config.js',
      scripts: {
        build: 'tsc --build',
        test: 'jest',
      },
      dependencies: {},
      devDependencies: {
        '@codeshift/utils': `^${utilVersion}`,
        '@codeshift/test-utils': `^${testUtilVersion}`,
        '@types/node': '^16.11.0',
        '@types/jest': '^26.0.15',
        jest: '^26.6.0',
        jscodeshift: '^0.13.1',
        prettier: '^1.16.4',
        'ts-jest': '^26.4.4',
        typescript: '^4.3.5',
      },
    },
    null,
    2,
  );
}

function getConfig(packageName: string, transform?: string, preset?: string) {
  return `module.exports = {
  maintainers: [],
  target: [],
  description: 'Codemods for ${packageName}',
  transforms: {${
    transform
      ? `'${transform}': require.resolve('./${transform}/transform'),`
      : ''
  }},
  presets: {${
    preset ? `'${preset}': require.resolve('./${preset}/transform'),` : ''
  }},
};
`;
}

function updateConfig(
  path: string,
  packageName: string,
  transformName: string,
  type: 'version' | 'preset',
) {
  const source = fs.readFileSync(path, 'utf8');
  const ast = recast.parse(source);
  const b = recast.types.builders;
  const key = type === 'version' ? 'transforms' : 'presets';

  recast.visit(ast, {
    visitProperty(path) {
      // @ts-ignore
      if (path.node.key.name !== key) return false;
      // @ts-ignore
      const properties = path.node.value.properties;
      // @ts-ignore
      properties.forEach(property => {
        if (property.key.value === transformName) {
          throw new Error(
            `Transform for ${packageName} ${transformName} already exists`,
          );
        }
      });

      properties.push(
        b.property(
          'init',
          b.stringLiteral(transformName),
          b.callExpression(
            b.memberExpression(
              b.identifier('require'),
              b.identifier('resolve'),
            ),
            [b.stringLiteral(`./${transformName}/transform`)],
          ),
        ),
      );

      return false;
    },
  });

  return recast.prettyPrint(ast, { quote: 'single', trailingComma: true }).code;
}

export function initDirectory(
  packageName: string,
  targetPath: string = './',
  isReduced: boolean = false,
) {
  const basePath = `${targetPath}/${packageName.replace('/', '__')}`;
  const configPath = `${basePath}${
    !isReduced ? '/src' : ''
  }/codeshift.config.js`;

  fs.copySync(`${__dirname}/../template${isReduced ? '/src' : ''}`, basePath, {
    filter: src => !src.includes('src/codemod'),
  });

  if (!isReduced) {
    fs.writeFileSync(
      path.join(basePath, 'package.json'),
      getPackageJson(packageName),
    );
  }

  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, getConfig(packageName));
  }
}

export function initTransform(
  packageName: string,
  id: string,
  type: 'version' | 'preset',
  targetPath: string = './',
  isReduced: boolean = false,
) {
  if (type === 'version' && !semver.valid(id)) {
    throw new Error(`Provided version ${id} is not a valid semver version`);
  }

  const basePath = `${targetPath}/${packageName.replace('/', '__')}`;
  const transformPath = `${basePath}${!isReduced ? '/src' : ''}/${id}`;
  const configPath = `${basePath}${
    !isReduced ? '/src' : ''
  }/codeshift.config.js`;

  if (fs.existsSync(transformPath)) {
    throw new Error(`Codemod for ${type} "${id}" already exists`);
  }

  fs.copySync(`${__dirname}/../template${isReduced ? '/src' : ''}`, basePath);
  fs.renameSync(
    `${basePath}${!isReduced ? '/src' : ''}/codemod`,
    transformPath,
  );

  const testFilePath = path.join(transformPath, 'transform.spec.ts');
  const testFile = fs
    .readFileSync(testFilePath, 'utf8')
    .replace('<% packageName %>', packageName)
    .replace('<% seperator %>', type === 'version' ? '@' : '#')
    .replace('<% transform %>', id || '');

  fs.writeFileSync(testFilePath, testFile);

  if (!isReduced) {
    fs.writeFileSync(
      path.join(basePath, 'package.json'),
      getPackageJson(packageName),
    );
  }

  fs.writeFileSync(
    configPath,
    updateConfig(configPath, packageName, id || '', type),
  );
}
