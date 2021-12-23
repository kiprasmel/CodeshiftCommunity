import { JSCodeshift, Collection, FileInfo, API, Options } from "jscodeshift";

export type Transformer<Config = {}, C = any> = (
    j: JSCodeshift, //
    src: Collection<C>,
    fileInfo: FileInfo,
    api: API,
    options: Options,
    config: Config,
) => void;

// `unknown` not enough -- `any` intentionally
export type TupleOfTransformerAndConfigs<Config = any> = readonly [Transformer<Config>, Config[]] // TODO ESLINT

/**
 * infers the Config type from the first argument - transform,
 * & thus even provides auto-completions if writing the config in-place.
 */
export const transformerWithTypesafeConfigs = <C>(
    transformer: Transformer<C>, //
    configs: C[],
): TupleOfTransformerAndConfigs<C> => [transformer, configs];

export const composeTransforms = <
    Tuples extends readonly TupleOfTransformerAndConfigs[] = TupleOfTransformerAndConfigs[]
>(
    tuplesOfTransformsWithTypesafeConfigs: Tuples,
) =>
    /**
     * ```python
     * for each file in given directory (not seen here - handled by jscodeshift internally)
     * 	read file (only once, since transforms are composed!)
     * 	for each transform in transforms
     * 		for each config of that transform's configs
     *   		run transform with config on file
     *
     * for each file
     * 	write file (again, only once per file. did not write in previous loop since were kept in memory (probably?))
     * ```
     *
     * ---
     *
     * note - more nuances & technical details exist,
     * e.g. parallelism, keeping (or not!) in-memory, etc.
     *
     */
    (
        ...transformerParamsExceptConfig: [j: JSCodeshift, src: Collection<any>, fileInfo: FileInfo, api: API, options: Options]
    ): void[][] =>
        tuplesOfTransformsWithTypesafeConfigs.map(([transformer, configs]) =>
            /**
             * `configs` are already verified previously;
             *
             * the problem is that typescript doesn't dig deep enough
             * to verify that for each transformer, that transformer will receive
             * the appropriate configs, since we're inside an array.
             *
             * Thus, here, we just provide the type assertion ourselves,
             * and hopefully we'll be able to get rid of it in the future.
             *
             */
            (configs as typeof transformer extends Transformer<infer C> ? C[] : never).map(config =>
                transformer(
                    // api.j, //
                    // source,
                    // file,
                    // api,
                    // options,
                    ...transformerParamsExceptConfig,
                    config,
                ),
            ),
        );

export const createCodemodFromComposedTransforms = <
    Tuples extends readonly TupleOfTransformerAndConfigs[] = TupleOfTransformerAndConfigs[] //
>(
    tuplesOfTransformsWithTypesafeConfigs: Tuples, //
) => (
    file: FileInfo, //
    api: API,
    options: Options,
) => {
    /**
     * passing in the same `source` for all codemods is important --
     * if we just passed in the `file.source`,
     * all transforms would get the same fresh copy,
     * and no changes would be made.
     *
     * here, we first turn it into a Collection<any> by using
     * `api.j`, aka `api.jscodeshift`.
     *
     * this way, changes persist into `source`,
     * and in the end of this function,
     * we return the combined output.
     *
     */
    const source = api.j(file.source);

    const runTransformsOneAfterAnotherOnEachFile = composeTransforms<Tuples>(tuplesOfTransformsWithTypesafeConfigs);

    runTransformsOneAfterAnotherOnEachFile(api.j, source, file, api, options);

    return source.toSource(options.printOptions);
};
