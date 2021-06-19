import fs from 'fs-extra';
import semver from 'semver';
import * as recast from 'recast';

function main(packageName: string, version: string) {
  if (!packageName) throw new Error('Package name was not provided');
  if (!version) throw new Error('Version was not provided');

  if (!semver.valid(version)) {
    throw new Error(
      `Provided version ${version} is not a valid semver version`,
    );
  }

  const communityDirectoryPath = `${__dirname}/../../../community`;
  const safePackageName = packageName.replace('/', '__');
  const codemodBasePath = `${communityDirectoryPath}/${safePackageName}`;
  const codemodPath = `${codemodBasePath}/${version}`;
  const configPath = `${codemodBasePath}/codeshift.config.js`;
  const motionsPath = `${codemodPath}/motions`;

  fs.mkdirSync(codemodPath, { recursive: true });

  fs.copyFileSync(
    `${__dirname}/../template/transform.spec.ts`,
    `${codemodPath}/transform.spec.ts`,
  );
  fs.copyFileSync(
    `${__dirname}/../template/transform.ts`,
    `${codemodPath}/transform.ts`,
  );
  fs.copySync(`${__dirname}/../template/motions`, motionsPath);

  const testFile = fs
    .readFileSync(`${codemodPath}/transform.spec.ts`, 'utf8')
    .replace('<% packageName %>', packageName)
    .replace('<% version %>', version);

  fs.writeFileSync(`${codemodPath}/transform.spec.ts`, testFile);

  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(
      configPath,
      `export default {
  maintainers: [],
  transforms: {
    '${version}': require('./${version}/transform'),
  }
};
`,
    );
  } else {
    const source = fs.readFileSync(configPath, 'utf8');
    const ast = recast.parse(source);
    const b = recast.types.builders;

    recast.visit(ast, {
      visitProperty(path) {
        // @ts-ignore
        if (path.node.key.name !== 'transforms') return false;
        // @ts-ignore
        const properties = path.node.value.properties;
        // @ts-ignore
        properties.forEach(property => {
          if (semver.eq(property.key.value, version)) {
            throw new Error(
              `Transform for ${packageName} version ${version} already exists`,
            );
          }
        });

        properties.push(
          b.property(
            'init',
            b.stringLiteral(version),
            b.callExpression(b.identifier('require'), [
              b.stringLiteral(`./${version}/transform`),
            ]),
          ),
        );

        return false;
      },
    });

    fs.writeFileSync(
      configPath,
      recast.prettyPrint(ast, { quote: 'single', trailingComma: true }).code,
    );
  }

  console.log(
    `🚚 New codemod package created at: community/${safePackageName}/${version}`,
  );
}

main(process.argv[2], process.argv[3]);