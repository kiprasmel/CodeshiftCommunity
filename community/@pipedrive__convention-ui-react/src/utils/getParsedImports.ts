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

export interface PoorlyTypedSpecifier {
    imported?: {
        name?: string;
    };
    local?: {
        name?: string;
    };
}

// TODO TS
export interface PoorlyTypedSpecifierButNonNullable {
    imported: {
        name: string;
    };
    local: {
        name: string;
    };
}

export const getParsedImports = (j: JSCodeshift, src: Src<typeof j>, ret: ParsedImport[] = []): ParsedImport[] => (
    src.find(j.ImportDeclaration).forEach(path =>
        ret.push({
            from: path.node.source.value as string, // TODO TS
            specifiers: (path.node.specifiers as PoorlyTypedSpecifier[]) // TODO TS
                .filter(
                    (s: PoorlyTypedSpecifier): boolean =>
                        !!(s && s.imported && s.imported.name && s.local && s.local.name),
                )
                .map(
                    (s): Specifier => ({
                        exportedAs: (s as PoorlyTypedSpecifierButNonNullable).imported.name, // TODO TS
                        importedAs: (s as PoorlyTypedSpecifierButNonNullable).local.name, // TODO TS
                    }),
                ),
        }),
    ),
    ret
);
