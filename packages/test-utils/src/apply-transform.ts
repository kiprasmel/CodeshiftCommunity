import jscodeshift from 'jscodeshift';

export type Parser = 'babel' | 'babylon' | 'flow' | 'ts' | 'tsx';

export interface Options {
  parser?: Parser;
}

export function applyTransform(
  transform: any,
  input: string,
  options: Options = {
    parser: 'babel',
  },
) {
  // Handle ES6 modules using default export for the transform
  const transformer = transform.default ? transform.default : transform;
  const output = transformer(
    { source: input },
    {
      jscodeshift: jscodeshift.withParser(options.parser as string),
      stats: () => {},
    },
    options || {},
  );

  return (output || '').trim();
}

export default applyTransform;
