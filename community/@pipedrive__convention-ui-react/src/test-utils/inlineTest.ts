import { createTransformer, Transformer } from "./createTransformer";

const defineInlineTest = require("jscodeshift/dist/testUtils").defineInlineTest;

export interface InlineTestProps {
    /** aka the "motion" */
    transformer: Transformer;
    defineInlineTestOptions?: Record<any, any>;
    from: string;
    to: string;
    /** it should do what? */
    should: string;
}

export const inlineTest = (props: InlineTestProps) => {
    return defineInlineTest(
        {
            default: createTransformer(props.transformer),
            ...(props.defineInlineTestOptions || {}),
        },
        {},
        props.from.trim(),
        props.to.trim(),
        props.should,
    );
};
