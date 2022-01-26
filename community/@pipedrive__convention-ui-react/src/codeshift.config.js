// const path = require("path");

module.exports = {
    maintainers: ["kiprasmel"],
    target: [],
    description: "Codemods for @pipedrive/convention-ui-react",
    transforms: {
        // "5.0.0": path.resolve("./5.0.0/codemod"), //
        "5.0.0": "./5.0.0/codemod.ts", //
        "5.0.0-css": "./5.0.0/codemod.postcss.ts",
    },
    presets: {},
};
