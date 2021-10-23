import { Options } from "@codeshift/test-utils";

import { createTransformer, Transformer } from "./createTransformer";

const defineInlineTest = require("jscodeshift/dist/testUtils").defineInlineTest;

export interface InlineTestPropsBase {
    /** aka the "motion" */
    transformer: Transformer;
    /** it should do what? */
    should: string;
    defineInlineTestOptions?: Record<any, any> & Options;
}

export type InlineTestPropsA = InlineTestPropsBase & {
    from: string;
    to: string;
};
export type InlineTestPropsB = InlineTestPropsBase & {
    fromTo: string;
};
export type InlineTestProps = InlineTestPropsA | InlineTestPropsB;

export type InlinteTestRet = ReturnType<typeof defineInlineTest>;

export function inlineTest(props: InlineTestPropsA): InlinteTestRet;
export function inlineTest(props: InlineTestPropsB): InlinteTestRet;

export function inlineTest(props: InlineTestProps): InlinteTestRet {
    if (!props.defineInlineTestOptions) {
        props.defineInlineTestOptions = {
            /**
             * lmao, atm only `flow` works for both js & ts
             *
             * in the astexplorer, the `@typescript-eslint/parser` worked well,
             * I wonder if we can add it (probably yes).
             *
             * TODO test more scenarios of different langs we're using
             * before releasing to make sure we don't screw up
             * for a common scenario.
             *
             * though JS & TS already deep in what I wanna support.
             *
             */
            parser: "flow",
        };
    }

    return defineInlineTest(
        {
            default: createTransformer(props.transformer),
            ...(props.defineInlineTestOptions || {}),
        },
        {},
        ("fromTo" in props ? props.fromTo : props.from).trim(),
        ("fromTo" in props ? props.fromTo : props.to).trim(),
        props.should,
    );
}
