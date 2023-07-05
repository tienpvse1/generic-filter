import { ExpressionBuilder, Kysely } from 'kysely';
import { IArgs, OperatorKey } from '../interfaces/filter';
import { BaseService } from '../interfaces/service';

export class KyselyService<Entity, DB> extends BaseService<Entity, Kysely<DB>> {
  private tableName: Parameters<Kysely<DB>['selectFrom']>[0];
  constructor(
    repository: Kysely<DB>,
    tableName: Parameters<Kysely<DB>['selectFrom']>[0],
  ) {
    super(repository);
    this.tableName = tableName;
  }
  async findOne(args: IArgs<Entity>): Promise<Entity> {
    return this.repository
      .selectFrom(this.tableName)
      .selectAll()
      .where((eb) => {
        const conditions = [];
        this.loop(args.where, (key, _, operator, value, index) => {
          this.handleOperators(conditions, eb, key, operator, index, value);
        });
        return eb.and(conditions);
      })
      .executeTakeFirst() as Promise<Entity>;
  }
  async find(args: IArgs<Entity>): Promise<Entity[]> {
    return this.repository
      .selectFrom(this.tableName)
      .selectAll()
      .where((eb) => {
        const conditions = [];
        this.loop(args.where, (key, _, operator, value, index) => {
          this.handleOperators(conditions, eb, key, operator, index, value);
        });
        return eb.and(conditions);
      })
      .execute() as Promise<Entity[]>;
  }
  handleOperators(
    conditions = [],
    eb: ExpressionBuilder<any, any>,
    key: string,
    operator: OperatorKey,
    _index: number,
    value: any,
  ) {
    if (operator === 'eq') conditions.push(eb.cmpr(key, '=', value));
    if (operator === 'ne') conditions.push(eb.cmpr(key, '!=', value));
    if (operator === 'gt') conditions.push(eb.cmpr(key, '>', value));
    if (operator === 'gte') conditions.push(eb.cmpr(key, '>=', value));
    if (operator === 'ilike') conditions.push(eb.cmpr(key, 'ilike', value));
    if (operator === 'like') conditions.push(eb.cmpr(key, 'like', value));
    if (operator === 'in') conditions.push(eb.cmpr(key, 'in', value));
    if (operator === 'nin') conditions.push(eb.cmpr(key, 'not in', value));
    if (operator === 'lt') conditions.push(eb.cmpr(key, '<', value));
    if (operator === 'lte') conditions.push(eb.cmpr(key, '<=', value));
    if (operator === 'isNull' && value)
      conditions.push(eb.cmpr(key, 'is', null));
    if (operator === 'isNull' && !value)
      conditions.push(eb.cmpr(key, 'is not', null));
    if (operator === 'between') {
    }
    if (operator === 'iRegex') {
    }
    if (operator === 'regex') {
    }
    if (operator === 'similar') {
    }
    if (operator === 'or') {
      const orCondition = [];
      for (const whereCondition of value) {
        this.loop(whereCondition, (key, _, operator, value) => {
          this.handleOperators(orCondition, eb, key, operator, _index, value);
        });
      }
      conditions.push(eb.or(orCondition));
    }
    if (operator === 'and') {
      const orCondition = [];
      for (const whereCondition of value) {
        this.loop(whereCondition, (key, _, operator, value) => {
          this.handleOperators(orCondition, eb, key, operator, _index, value);
        });
      }
      conditions.push(eb.and(orCondition));
    }
    return conditions;
  }
}
