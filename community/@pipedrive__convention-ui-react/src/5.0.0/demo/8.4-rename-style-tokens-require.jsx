/* eslint-disable */

const styled = require("styled-components");

const colors = require("@pipedrive/convention-ui-css/dist/amd/colors.js");
const elevations = require("@pipedrive/convention-ui-css/dist/amd/elevations.js");
const fonts = require("@pipedrive/convention-ui-css/dist/amd/fonts.js");
const spacings = require("@pipedrive/convention-ui-css/dist/amd/spacings.js");

export const Foo = styled.div`
    color: ${colors["$color-black-hex"]};
    font: ${fonts["$font-body"]};
    box-shadow: ${elevations["$elevation-01"]};
    padding: ${spacings["$spacing-m"]};
`;
