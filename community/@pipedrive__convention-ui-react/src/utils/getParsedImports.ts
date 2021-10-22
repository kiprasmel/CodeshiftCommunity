import { JSCodeshift } from "jscodeshift";

export type Src<T extends JSCodeshift> = ReturnType<T>;

export interface Specifier {
    /** original name */
    exportedAs: string;
    /** name used in end user's code */
    importedAs: string;
}

export interface ParsedImport {
    from: string;
    specifiers: Specifier[];
}

// TODO TS
export interface PoorlyTypedSpecifier {
    imported?: {
        name?: string;
    };
    local?: {
        name?: string;
    };
}

export const getParsedImports = (j: JSCodeshift, src: Src<typeof j>, ret: ParsedImport[] = []): ParsedImport[] => (
    src.find(j.ImportDeclaration).forEach(path =>
        ret.push({
            from: path.node.source.value as string, // TODO TS
            specifiers: path.node.specifiers
                .filter((s: PoorlyTypedSpecifier) => s && s.imported && s.local) // TODO TS
                .map((s: PoorlyTypedSpecifier) => ({
                    // TODO TS
                    exportedAs: s.imported.name,
                    importedAs: s.local.name,
                })),
        }),
    ),
    ret
);
