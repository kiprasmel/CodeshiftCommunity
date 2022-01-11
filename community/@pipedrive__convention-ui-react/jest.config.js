module.exports = {
    /**
     * test both our transforms,
     * and the reusable-transforms as well,
     * since we depend on them (and are authors as well).
     *
     * https://stackoverflow.com/a/67244212/9285308
     */
    roots: [
        ".", //
        "../../packages/reusable-transforms",
    ],
    transform: {
        "^.+\\.ts$": "ts-jest", //
    },
    moduleFileExtensions: [
        "ts", //
        "tsx",
        "js",
    ],
    testRegex: "^.+\\.spec\\.(tsx|ts|js)$",
    globals: {
        //
        "ts-jest": {
            tsconfig: "tsconfig.json",
        },
    },
    testPathIgnorePatterns: [
        "/node_modules/", //
        "dist/",
    ],
};
