import mongoose from 'mongoose';
import { DeepPartial } from 'typeorm';
import { IArgs, OperatorKey } from './filter';

export abstract class BaseService<Entity, R> {
  protected repository: R;
  constructor(repository: R) {
    this.repository = repository;
  }
  findMany?(args: IArgs<Entity>): Promise<Entity[]>;
  findOne?(args: IArgs<Entity>): Promise<Entity | null>;
  find?(args: IArgs<Entity>): Promise<Entity[]>;
  createOne?(input: DeepPartial<Entity>): Promise<Entity>;
  createMany?(input: DeepPartial<Entity>[]): Promise<Entity[]>;
  deleteById?(id: string | mongoose.Schema.Types.ObjectId): Promise<boolean>;
  delete?(args: IArgs<Entity>): Promise<{ affectedRows: number }>;
  updateByPk?(
    id: string | mongoose.Schema.Types.ObjectId,
    set: DeepPartial<Entity>,
  ): Promise<Entity>;
  update?(args: IArgs<Entity>, set: DeepPartial<Entity>): Promise<Entity>;

  /**
   * a simple 2-level nested loop function that will flatten the ***where*** argument and provides flattened values in callback which can be used to handle whatever we want with those values
   * @param where where arguments
   * @param callback callback function that will be provided with flattened values
   * @param initialIndex counter value that will increase after each loop
   * @returns
   */
  protected loop(
    where: IArgs<Entity>['where'],
    callback: (
      key: string,
      expression: any,
      operator: OperatorKey,
      value: any,
      index: number,
    ) => any,
    initialIndex = 0,
  ) {
    let index = initialIndex;
    if (!where) return;
    for (const [key, expression] of Object.entries(where)) {
      // 'and' & 'or' are special properties, they're not actual properties in Entity, so they have to be handled a bit different
      if (key === 'and' || key === 'or') {
        callback('', expression, key, expression, index);
        continue;
      }
      for (const [operator, value] of Object.entries(expression)) {
        callback(key, expression, operator as OperatorKey, value, index);
        index++;
      }
    }
  }
}
