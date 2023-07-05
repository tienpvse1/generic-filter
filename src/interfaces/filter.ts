import mongoose from 'mongoose';

export interface IArgs<T> {
  where?: IWhere<T>;
  limit?: number;
  offset?: number;
}

export type IExpression<T> = {
  eq?: T;
};

type BaseExpression<T> = {
  eq?: T;
  ne?: T;
  in?: T[];
  nin?: T[];
  gt?: T;
  gte?: T;
  lt?: T;
  lte?: T;
  isNull?: boolean;
};

export type ObjectIdExpression = {
  eq?: mongoose.Schema.Types.ObjectId | string;
  ne?: mongoose.Schema.Types.ObjectId | string;
  in?: (mongoose.Schema.Types.ObjectId | string)[];
  nin?: (mongoose.Schema.Types.ObjectId | string)[];
};
export type StringExpression = {
  regex?: string;
  iRegex?: string;
  like?: string;
  ilike?: string;
  similar?: string;
} & BaseExpression<string>;

export type NumberExpression = {
  between?: [number, number];
} & BaseExpression<number>;

export type BooleanExpression = {
  eq?: boolean;
  ne?: boolean;
  in?: boolean;
  nin?: boolean;
  isNull?: boolean;
};

export type IWhere<T> = {
  [K in keyof T]?: T[K] extends string
    ? StringExpression
    : T[K] extends mongoose.Schema.Types.ObjectId
    ? ObjectIdExpression
    : T[K] extends mongoose.Types.ObjectId
    ? ObjectIdExpression
    : T[K] extends number
    ? NumberExpression
    : T[K] extends boolean
    ? BooleanExpression
    : never;
} & { or?: IWhere<T>[]; and?: IWhere<T>[] };

export type OperatorKey =
  | keyof (StringExpression & NumberExpression & BooleanExpression)
  | 'or'
  | 'and';
