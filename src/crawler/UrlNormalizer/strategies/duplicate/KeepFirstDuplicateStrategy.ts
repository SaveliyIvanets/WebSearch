import { QueryParam, DuplicateParamStrategy } from "./DuplicateParamStrategy.js";

export class KeepFirstDuplicateStrategy implements DuplicateParamStrategy {
    apply(params: QueryParam[]): QueryParam[] {
        const unique_params: Map<string, string> = new Map<string, string>();
        for (const [name, val] of params) {
            if (!unique_params.has(name)) {
                unique_params.set(name, val);
            }
        }

        return [...unique_params];
    }
}