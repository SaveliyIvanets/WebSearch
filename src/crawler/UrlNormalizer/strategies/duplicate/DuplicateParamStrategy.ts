import { Strategy } from "../strategy.js";

export type QueryParam = [string, string]

export interface DuplicateParamStrategy extends Strategy<QueryParam[]> {
    apply(params: QueryParam[]): QueryParam[];
}