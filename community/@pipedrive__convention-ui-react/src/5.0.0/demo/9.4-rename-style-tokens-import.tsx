// @ts-nocheck

import styled from "styled-components";

import colorsAmd from "@pipedrive/convention-ui-css/dist/amd/colors.js";
import elevationsAmd from "@pipedrive/convention-ui-css/dist/amd/elevations.js";
import fontsAmd from "@pipedrive/convention-ui-css/dist/amd/fonts.js";
import spacingsAmd from "@pipedrive/convention-ui-css/dist/amd/spacings.js";

export const FooAmd = styled.div`
    color: ${colorsAmd["$color-black-hex"]};
    font: ${fontsAmd["$font-body"]};
    box-shadow: ${elevationsAmd["$elevation-01"]};
    padding: ${spacingsAmd["$spacing-m"]};
`;

//

/*
import colorsJson from "@pipedrive/convention-ui-css/dist/json/colors.json";
import elevationsJson from "@pipedrive/convention-ui-css/dist/json/elevations.json";
import fontsJson from "@pipedrive/convention-ui-css/dist/json/fonts.json";
import spacingsJson from "@pipedrive/convention-ui-css/dist/json/spacings.json";

export const FooJson = styled.div`
    color: ${colorsJson["$color-black-hex"]};
    font: ${fontsJson["$font-body"]};
    box-shadow: ${elevationsJson["$elevation-01"]};
    padding: ${spacingsJson["$spacing-m"]};
`;
*/

//

/*
import colorsConventioned from "@pipedrive/convention-ui-css/dist/json/colors-conventioned.json";
import elevationsConventioned from "@pipedrive/convention-ui-css/dist/json/elevations-conventioned.json";
import fontsConventioned from "@pipedrive/convention-ui-css/dist/json/fonts-conventioned.json";
import spacingsConventioned from "@pipedrive/convention-ui-css/dist/json/spacings-conventioned.json";

export const FooConventioned = styled.div`
    color: ${colorsConventioned.black};
    font: ${fontsConventioned.fontBody};
    box-shadow: ${elevationsConventioned.elevation01};
    padding: ${spacingsConventioned.spacingM};
`;
*/

//

/*
import {
    colors as colorsFromVars,
    elevations as elevationsFromVars,
    fonts as fontsFromVars,
    spacings as spacingsFromVars,
} from "@pipedrive/convention-ui-css/dist/js/variables";

export const FooFromVars = styled.div`
    color: ${colorsFromVars.black};
    font: ${fontsFromVars.fontBody};
    box-shadow: ${elevationsFromVars.elevation01};
    padding: ${spacingsFromVars.spacingM};
`;
*/
