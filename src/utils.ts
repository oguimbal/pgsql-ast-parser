export type Optional<T> = { [key in keyof T]?: T[key] };

export type nil = undefined | null;

type Impossible<K extends keyof any> = {
    [P in K]: never;
};
export type NoExtraProperties<T, U extends T = T> = U & Impossible<Exclude<keyof U, keyof T>>;



export type ReplaceReturnType<T, TNewReturn> = T extends (...a: any) => any
    ? (...a: Parameters<T>) => TNewReturn
    : never;

export class NotSupported extends Error {
    constructor(what?: string) {
        super('Not supported' + (what ? ': ' + what : ''));
    }

    static never(value: never, msg?: string) {
        return new NotSupported(`${msg ?? ''} ${JSON.stringify(value)}`);
    }
}

export function trimNullish<T>(value: T, depth = 5): T {
    if (depth < 0)
        return value;
    if (value instanceof Array) {
        value.forEach(x => trimNullish(x, depth - 1))
    }
    if (typeof value !== 'object' || value instanceof Date)
        return value;

    if (!value) {
        return value;
    }

    for (const k of Object.keys(value)) {
        const val = (value as any)[k];
        if (val === undefined || val === null)
            delete (value as any)[k];
        else
            trimNullish(val, depth - 1);
    }
    return value;
}