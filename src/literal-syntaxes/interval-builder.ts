import { Interval } from '../syntax/ast';
import { nil } from '../utils';

const types: [keyof Interval, number][] = [
    ['years', 12],
    ['months', 30],
    ['days', 24],
    ['hours', 60],
    ['minutes', 60],
    ['seconds', 1000],
    ['milliseconds', 0],
]

type E = [keyof Interval, number];
type K = E | K[];
function* unwrap(k: K): IterableIterator<E> {
    if (typeof k[1] === 'number') {
        yield k as E;
    } else {
        for (const v of k as K[]) {
            yield* unwrap(v);
        }
    }
}

export function buildInterval(orig: string, vals: 'invalid' | K): Interval {
    const ret: Interval = {};
    if (vals === 'invalid') {
        throw new Error(`invalid input syntax for type interval: "${orig}"`)
    }
    for (const [k, v] of unwrap(vals)) {
        ret[k] = (ret[k] ?? 0) + v;
    }
    return ret;
}


/** Returns a normalized copy of the given interval */
export function normalizeInterval(value: Interval): Interval {
    const ret = { ...value };

    // trim non-integers
    for (let i = 0; i < types.length; i++) {
        const [k, mul] = types[i];
        const v = ret[k] ?? 0;
        const int = v >= 0
            ? Math.floor(v)
            : Math.ceil(v);
        if (!v || int === v) {
            continue;
        }
        const nk = types[i + 1]?.[0];
        if (nk) {
            ret[nk] = (ret[nk] ?? 0) + mul * (v - int);
        }
        ret[k] = int;
    }

    if (ret.months || ret.years) {
        const m = (ret.months ?? 0) + (ret.years ?? 0) * 12;
        ret.months = m % 12;
        ret.years = (m - ret.months) / 12;
    }

    // normalize time
    let t = (ret.hours ?? 0) * 3600
        + (ret.minutes ?? 0) * 60
        + (ret.seconds ?? 0)
        + (ret.milliseconds ?? 0) / 1000;
    let sign = 1;
    if (t < 0) {
        sign = -1;
        t = -t;
    }

    if (t >= 3600) {
        ret.hours = sign * Math.floor(t / 3600);
        t -= sign * ret.hours * 3600;
    } else {
        delete ret.hours;
    }

    if (t >= 60) {
        ret.minutes = sign * Math.floor(t / 60);
        t -= sign * ret.minutes * 60;
    } else {
        delete ret.minutes;
    }

    if (t > 0) {
        ret.seconds = sign * Math.floor(t);
        t -= sign * ret.seconds;
    } else {
        delete ret.seconds;
    }

    if (t > 0) {
        ret.milliseconds = sign * Math.round(t * 1000);
    } else {
        delete ret.milliseconds;
    }


    // trim zeros.
    for (const [k] of types) {
        if (!ret[k]) {
            delete ret[k];
        }
    }

    return ret;
}

/** Interval value to postgres string representation  */
export function intervalToString(value: Interval): String {
    value = normalizeInterval(value);
    const ret: string[] = [];
    if (value.years) {
        ret.push(value.years === 1 ? '1 year' : value.years + ' years');
    }
    if (value.months) {
        ret.push(value.months === 1 ? '1 month' : value.months + ' months');
    }
    if (value.days) {
        ret.push(value.days === 1 ? '1 day' : value.days + ' days');
    }
    if (value.hours || value.minutes || value.seconds || value.milliseconds) {

        let time = `${num(value.hours ?? 0)}:${num(value.minutes ?? 0)}:${num(value.seconds ?? 0)}`
        if (value.milliseconds) {
            time = time + (value.milliseconds / 1000).toString().substr(1)

        }
        if (neg(value.hours) || neg(value.minutes) || neg(value.seconds) || neg(value.milliseconds)) {
            time = '-' + time;
        }
        ret.push(time);
    }
    return ret.join(' ');
}

function num(v: number) {
    v = Math.abs(v);
    return v < 10 ? '0' + v : v.toString();
}
function neg(v: number | nil) {
    return v && v < 0;
}