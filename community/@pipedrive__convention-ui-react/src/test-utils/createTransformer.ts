import { JSCodeshift, Collection, Node, FileInfo, API, Options } from "jscodeshift";

export type Transformer = (j: JSCodeshift, source: Collection<Node>) => void;

export const createTransformer = (transformer: Transformer) => (
    fileInfo: FileInfo,
    { jscodeshift: j }: API,
    options: Options,
) => {
    const source = j(fileInfo.source);

    transformer(j, source);

    return source.toSource(options.printOptions);
};
