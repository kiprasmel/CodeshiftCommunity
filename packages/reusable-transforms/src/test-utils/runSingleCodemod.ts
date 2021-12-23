import { FileInfo, API, Options } from "jscodeshift";

import { Transformer } from "@codeshift/reusable-transforms/src/utils/Transformer";

export const runSingleCodemod = <Config, T>(
    config: Config,
    transformer: Transformer<Config, T>, //
) => (
    fileInfo: FileInfo, //
    api: API,
    options: Options,
) => {
    const j = api.jscodeshift;

    const source = j(fileInfo.source);

    transformer(j, source, fileInfo, api, options, config);

    return source.toSource(options.printOptions);
};
