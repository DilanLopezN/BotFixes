import { OperatorType } from './interaction.interface';

export enum FilterType {
  attribute = 'attribute',
  recognizerScore = 'recognizer-score',
  lifespan = 'lifespan',
}

export interface ICondition{
    name?: string;
    operator?: OperatorType;
    value?: string;
    type: FilterType;
}

export enum FilterOperator{
    or = 'or',
    and = 'and',
}

export interface IFilter{
    conditions: ICondition[];
    operator: FilterOperator;
}

// export interface IFilter {
//   type?: FilterType;
// }

// export interface IAttributeFilter extends IFilter {
//   name?: string;
//   operator?: OperatorType;
//   value?: string;
// }

export interface IScoreFilter extends IFilter {
  value?: number;
}

export interface ILifespanFilter extends IFilter {
  value?: number;
}
