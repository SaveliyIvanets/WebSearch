import { QueryParam, DuplicateParamStrategy } from "./DuplicateParamStrategy.js";

export class MergeDuplicateStrategy implements DuplicateParamStrategy {
    constructor(private readonly join: string) {}

    apply(params: QueryParam[]): QueryParam[] {
        const unique_params: Map<string, string> = new Map<string, string>();
        for (const [name, val] of params) {
            const prev = unique_params.get(name);
            unique_params.set(name, prev === undefined ? val : `${prev}${this.join}${val}`);
        }

        return [...unique_params];
    }
}