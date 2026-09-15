import { QueryParam, DuplicateParamStrategy } from "./DuplicateParamStrategy.js";

export class KeepLastDuplicateStrategy implements DuplicateParamStrategy {
    apply(params: QueryParam[]): QueryParam[] {
        const unique_params: Map<string, string> = new Map<string, string>();
        for (const [name, val] of params) {
            unique_params.set(name, val);
        }

        return [...unique_params];
    }
}