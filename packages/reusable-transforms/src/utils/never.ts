export const never = (): never => {
    throw new Error("\nCODEMODS - you encountered behavior that should never happen. Create a bug report.");
};

export const assertNever = (x: never): never => {
    throw new Error("Unhandled discriminated union member: " + JSON.stringify(x));
};
