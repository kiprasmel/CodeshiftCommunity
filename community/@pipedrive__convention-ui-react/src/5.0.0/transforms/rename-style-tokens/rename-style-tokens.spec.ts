import dedent from "ts-dedent";

import { inlineTest } from "@codeshift/reusable-transforms/src/test-utils/inlineTest";

import cui5map from "../../mapping/tokenMapping.json";

import { renameStyleTokens } from "./rename-style-tokens"; // TODO regroupImports

/**
 * TODO FIXME - instead of using specific configs (e.g. `buttonConfig`),
 * generalize to test behavior not specific to existing configs.
 */

/**
 * maybe one day syntax highlighting...
 */
const jsx = dedent;

describe("@pipedrive/convention-ui-react@5.0.0 rename-style-tokens transform (with the current cui5map)", () => {
    inlineTest({
        transformer: renameStyleTokens,
        should:
            "replace usages of `@pipedrive/convention-ui-css/dist/amd/*.js` with `@pipedrive/convention-ui-react/dist/tokens`.",
        from: jsx`
			import styled from 'styled-components';

			import colors from '@pipedrive/convention-ui-css/dist/amd/colors.js';
			import elevations from '@pipedrive/convention-ui-css/dist/amd/elevations.js';
			import fonts from '@pipedrive/convention-ui-css/dist/amd/fonts.js';
			import spacings from '@pipedrive/convention-ui-css/dist/amd/spacings.js';

			export const Foo = styled.div\`
				color: \${colors["$color-black-hex"]};
				font: \${fonts["$font-body"]};
				box-shadow: \${elevations["$elevation-01"]};
				padding: \${spacings["$spacing-m"]};
			\`;
		`,
        to: jsx`
			import styled from 'styled-components';

			import { colors, elevations, fonts, spacings } from "@pipedrive/convention-ui-react/dist/tokens";

			export const Foo = styled.div\`
				color: \${colors["${cui5map.js.colors["$color-black-hex"]}"]};
				font: \${fonts["${cui5map.js.fonts["$font-body"]}"]};
				box-shadow: \${elevations["${cui5map.js.elevations["$elevation-01"]}"]};
				padding: \${spacings["${cui5map.js.spacings["$spacing-m"]}"]};
			\`;
		`,
    });
    inlineTest({
        transformer: renameStyleTokens,
        should:
            "replace usages of `@pipedrive/convention-ui-css/dist/amd/*.js` with `@pipedrive/convention-ui-react/dist/tokens`. (require)",
        from: jsx`
			const styled = require('styled-components');

			const colors = require('@pipedrive/convention-ui-css/dist/amd/colors.js');
			const elevations = require('@pipedrive/convention-ui-css/dist/amd/elevations.js');
			const fonts = require('@pipedrive/convention-ui-css/dist/amd/fonts.js');
			const spacings = require('@pipedrive/convention-ui-css/dist/amd/spacings.js');

			export const Foo = styled.div\`
				color: \${colors["$color-black-hex"]};
				font: \${fonts["$font-body"]};
				box-shadow: \${elevations["$elevation-01"]};
				padding: \${spacings["$spacing-m"]};
			\`;
		`,
        to: jsx`
			const styled = require('styled-components');

			const {
			    colors,
			    elevations,
			    fonts,
			    spacings
			} = require("@pipedrive/convention-ui-react/dist/tokens");

			export const Foo = styled.div\`
				color: \${colors["${cui5map.js.colors["$color-black-hex"]}"]};
				font: \${fonts["${cui5map.js.fonts["$font-body"]}"]};
				box-shadow: \${elevations["${cui5map.js.elevations["$elevation-01"]}"]};
				padding: \${spacings["${cui5map.js.spacings["$spacing-m"]}"]};
			\`;
		`,
    });

    inlineTest({
        transformer: renameStyleTokens,
        should:
            "replace usages of `@pipedrive/convention-ui-css/dist/json/*.json` with `@pipedrive/convention-ui-react/dist/tokens`.",
        from: jsx`
		import styled from 'styled-components';

		import colors from '@pipedrive/convention-ui-css/dist/json/colors.json';
		import elevations from '@pipedrive/convention-ui-css/dist/json/elevations.json';
		import fonts from '@pipedrive/convention-ui-css/dist/json/fonts.json';
		import spacings from '@pipedrive/convention-ui-css/dist/json/spacings.json';

		export const Foo = styled.div\`
			color: \${colors['$color-black-hex']};
			font: \${fonts['$font-body']};
			box-shadow: \${elevations['$elevation-01']};
			padding: \${spacings['$spacing-m']};
		\`;
		`,
        to: jsx`
			import styled from 'styled-components';

			import { colors, elevations, fonts, spacings } from "@pipedrive/convention-ui-react/dist/tokens";

			export const Foo = styled.div\`
				color: \${colors["${cui5map.js.colors["$color-black-hex"]}"]};
				font: \${fonts["${cui5map.js.fonts["$font-body"]}"]};
				box-shadow: \${elevations["${cui5map.js.elevations["$elevation-01"]}"]};
				padding: \${spacings["${cui5map.js.spacings["$spacing-m"]}"]};
			\`;
		`,
    });

    inlineTest({
        transformer: renameStyleTokens,
        should:
            "replace usages of `@pipedrive/convention-ui-css/dist/json/*-conventioned.json` with `@pipedrive/convention-ui-react/dist/tokens`.",
        from: jsx`
			import styled from 'styled-components';

			import colors from '@pipedrive/convention-ui-css/dist/json/colors-conventioned.json';
			import elevations from '@pipedrive/convention-ui-css/dist/json/elevations-conventioned.json';
			import fonts from '@pipedrive/convention-ui-css/dist/json/fonts-conventioned.json';
			import spacings from '@pipedrive/convention-ui-css/dist/json/spacings-conventioned.json';

			export const Foo = styled.div\`
				color: \${colors.black};
				font: \${fonts.fontBody};
				box-shadow: \${elevations.elevation01};
				padding: \${spacings.spacingM};
			\`;
		`,
        to: jsx`
			import styled from 'styled-components';

			import { colors, elevations, fonts, spacings } from "@pipedrive/convention-ui-react/dist/tokens";

			export const Foo = styled.div\`
				color: \${colors.${cui5map.js.colorsConventioned.black}};
				font: \${fonts.${cui5map.js.fontsConventioned.fontBody}};
				box-shadow: \${elevations.${cui5map.js.elevationsConventioned.elevation01}};
				padding: \${spacings.${cui5map.js.spacingsConventioned.spacingM}};
			\`;
		`,
    });
    inlineTest({
        transformer: renameStyleTokens,
        should:
            "replace usages of `@pipedrive/convention-ui-css/dist/json/*-conventioned.json` with `@pipedrive/convention-ui-react/dist/tokens`. (require)",
        from: jsx`
			const styled = require('styled-components');

			const colors = require('@pipedrive/convention-ui-css/dist/json/colors-conventioned.json');
			const elevations = require('@pipedrive/convention-ui-css/dist/json/elevations-conventioned.json');
			const fonts = require('@pipedrive/convention-ui-css/dist/json/fonts-conventioned.json');
			const spacings = require('@pipedrive/convention-ui-css/dist/json/spacings-conventioned.json');

			export const Foo = styled.div\`
				color: \${colors.black};
				font: \${fonts.fontBody};
				box-shadow: \${elevations.elevation01};
				padding: \${spacings.spacingM};
			\`;
		`,
        to: jsx`
			const styled = require('styled-components');

			const {
			    colors,
			    elevations,
			    fonts,
			    spacings
			} = require("@pipedrive/convention-ui-react/dist/tokens");

			export const Foo = styled.div\`
				color: \${colors.${cui5map.js.colorsConventioned.black}};
				font: \${fonts.${cui5map.js.fontsConventioned.fontBody}};
				box-shadow: \${elevations.${cui5map.js.elevationsConventioned.elevation01}};
				padding: \${spacings.${cui5map.js.spacingsConventioned.spacingM}};
			\`;
		`,
    });

    inlineTest({
        transformer: renameStyleTokens,
        should:
            "replace usages of `@pipedrive/convention-ui-css/dist/js/variables` with `@pipedrive/convention-ui-react/dist/tokens`.",
        from: jsx`
			import styled from 'styled-components';

			import { colors, elevations, fonts, spacings } from '@pipedrive/convention-ui-css/dist/js/variables';

			export const Foo = styled.div\`
				color: \${colors.black};
				font: \${fonts.fontBody};
				box-shadow: \${elevations.elevation01};
				padding: \${spacings.spacingM};
			\`;
		`,
        to: jsx`
			import styled from 'styled-components';

			import { colors, elevations, fonts, spacings } from "@pipedrive/convention-ui-react/dist/tokens";

			export const Foo = styled.div\`
				color: \${colors.${cui5map.js.colorsConventioned.black}};
				font: \${fonts.${cui5map.js.fontsConventioned.fontBody}};
				box-shadow: \${elevations.${cui5map.js.elevationsConventioned.elevation01}};
				padding: \${spacings.${cui5map.js.spacingsConventioned.spacingM}};
			\`;
		`,
    });
    inlineTest({
        transformer: renameStyleTokens,
        should:
            "replace usages of `@pipedrive/convention-ui-css/dist/js/variables` with `@pipedrive/convention-ui-react/dist/tokens`. (require)",
        from: jsx`
			const styled = require('styled-components');

			const { colors, elevations, fonts, spacings } = require('@pipedrive/convention-ui-css/dist/js/variables');

			export const Foo = styled.div\`
				color: \${colors.black};
				font: \${fonts.fontBody};
				box-shadow: \${elevations.elevation01};
				padding: \${spacings.spacingM};
			\`;
		`,
        to: jsx`
			const styled = require('styled-components');

			const {
			    colors,
			    elevations,
			    fonts,
			    spacings
			} = require("@pipedrive/convention-ui-react/dist/tokens");

			export const Foo = styled.div\`
				color: \${colors.${cui5map.js.colorsConventioned.black}};
				font: \${fonts.${cui5map.js.fontsConventioned.fontBody}};
				box-shadow: \${elevations.${cui5map.js.elevationsConventioned.elevation01}};
				padding: \${spacings.${cui5map.js.spacingsConventioned.spacingM}};
			\`;
		`,
    });

    // que ota?
});
