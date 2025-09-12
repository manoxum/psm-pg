import {lit} from "../utils/escape";

export function notice(message:string) {
    return `do $$ begin raise notice '%', ${lit( message )}; end $$;`
}