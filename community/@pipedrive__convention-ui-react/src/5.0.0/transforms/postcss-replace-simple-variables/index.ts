import { Declaration, PluginCreator } from 'postcss';

interface TokenMapping {
	to: string[];
}

interface PluginOptions {
	mappings: Record<string, TokenMapping>;
	valueTransform?: (value: string) => string;
}

const addVarToValue = (value: string) => `var(${value})`;

const postcssReplaceSimpleVariables: PluginCreator<PluginOptions> = (
	{ mappings, valueTransform = addVarToValue }: PluginOptions = { mappings: {} },
) => {
	return {
		postcssPlugin: 'postcss-replace-simple-variables',
		Declaration(decl: Declaration) {
			if (decl.value.startsWith('$') && decl.value in mappings) {
				const replacement = mappings[decl.value];
				decl.value = valueTransform(replacement.to[0]);
			}
		},
	};
};

postcssReplaceSimpleVariables.postcss = true;

export default postcssReplaceSimpleVariables;
