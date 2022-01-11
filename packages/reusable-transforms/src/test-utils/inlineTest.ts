import { Options } from "@codeshift/test-utils";

import { Transformer } from "@codeshift/reusable-transforms/src/utils/Transformer";

import { runSingleCodemod } from "./runSingleCodemod";

const defineInlineTest = require("jscodeshift/dist/testUtils").defineInlineTest;

export type InlineTestPropsBase<Config = {}> = {
    transformer: Transformer<Config>;
    /** it should do what? */
    should: string;
    defineInlineTestOptions?: Record<any, any> & Options;
} & ({} | never extends Config
    ? {
          config?: {};
      }
    : {
          config: Config;
      });

export type InlineTestPropsA<C> = InlineTestPropsBase<C> & {
    from: string;
    to: string;
};
export type InlineTestPropsB<C> = InlineTestPropsBase<C> & {
    fromTo: string;
};
export type InlineTestProps<C> = InlineTestPropsA<C> | InlineTestPropsB<C>;

export type InlineTestRet = ReturnType<typeof defineInlineTest>;

export function inlineTest<C>(props: InlineTestPropsA<C>): InlineTestRet;
export function inlineTest<C>(props: InlineTestPropsB<C>): InlineTestRet;

export function inlineTest<C>(props: InlineTestProps<C>): InlineTestRet {
    if (!props.defineInlineTestOptions) {
        props.defineInlineTestOptions = {
            /**
             * in the astexplorer, the `@typescript-eslint/parser` worked well,
             * I wonder if we can add it,
             * but atm only `flow` works for both js & ts.
             *
             * though it's not perfect:
             * see the pipedrive's CUI [README](../../../community/@pipedrive__convention-ui-react/README.md)
             *
             */
            parser: "flow",
        };
    }

    return defineInlineTest(
        {
            default: runSingleCodemod(props.config as C /** TODO TS */, props.transformer),
            ...(props.defineInlineTestOptions || {}),
        },
        {},
        ("fromTo" in props ? props.fromTo : props.from).trim(),
        ("fromTo" in props ? props.fromTo : props.to).trim(),
        props.should,
    );
}
