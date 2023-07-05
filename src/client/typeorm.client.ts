import {
  BaseEntity,
  Brackets,
  Repository,
  WhereExpressionBuilder,
} from "typeorm";
import { IArgs, OperatorKey } from "../interfaces/filter";
import { BaseService } from "../interfaces/service";

export class BaseTypeormService<Entity extends BaseEntity> extends BaseService<
  Entity,
  Repository<Entity>
> {
  qb: WhereExpressionBuilder;
  constructor(repository: Repository<Entity>) {
    super(repository);
  }
  async find(args: IArgs<Entity>): Promise<Entity[]> {
    const condition = new Brackets((qb) => {
      this.loop(args.where, (key, expression, operator, value, index) => {
        this.handleOperators(qb, key, operator, index, value);
      });
    });
    return this.repository.createQueryBuilder().where(condition).getMany();
  }
  async findOne(args: IArgs<Entity>): Promise<Entity | null> {
    const condition = new Brackets((qb) => {
      this.loop(args.where, (key, expression, operator, value, index) => {
        this.handleOperators(qb, key, operator, index, value);
      });
    });
    return this.repository.createQueryBuilder().where(condition).getOne();
  }
  handleOperators(
    qb: WhereExpressionBuilder,
    key: string,
    operator: OperatorKey,
    index: number,
    value: any,
    andOr: "andWhere" | "orWhere" = "andWhere"
  ) {
    const fieldName = `${key}_${operator}_${index}`;
    if (operator === "eq")
      qb[andOr](`${key} = :${fieldName}`, { [fieldName]: value });
    if (operator === "ne")
      qb[andOr](`${key} <> :${fieldName}`, { [fieldName]: value });
    if (operator === "gt")
      qb[andOr](`${key} > :${fieldName}`, { [fieldName]: value });
    if (operator === "gte")
      qb[andOr](`${key} >= :${fieldName}`, { [fieldName]: value });
    if (operator === "ilike")
      qb[andOr](`${key} ILIKE :${fieldName}`, { [fieldName]: value });
    if (operator === "like")
      qb[andOr](`${key} LIKE :${fieldName}`, { [fieldName]: value });
    if (operator === "in")
      qb[andOr](`${key} IN (:...${fieldName})`, { [fieldName]: value });
    if (operator === "nin")
      qb[andOr](`${key} NOT IN (:...${fieldName})`, {
        [fieldName]: value,
      });
    if (operator === "isNull" && value) qb[andOr](`${key} IS NULL`);
    if (operator === "isNull" && !value) qb[andOr](`${key} IS NOT NULL`);
    if (operator === "lt")
      qb[andOr](`${key} < :${fieldName}`, { [fieldName]: value });
    if (operator === "lte")
      qb[andOr](`${key} <= :${fieldName}`, { [fieldName]: value });
    if (operator === "between") {
    }
    if (operator === "iRegex") {
    }
    if (operator === "regex") {
    }
    if (operator === "similar") {
    }
    if (operator === "or") {
      qb.andWhere(
        new Brackets((qb) => {
          this.loop(value, (k, e, op, v, i) => {
            this.handleOperators(qb, k, op, i, v, "orWhere");
          });
        })
      );
    }
    if (operator === "and") {
      qb.andWhere(
        new Brackets((qb) => {
          this.loop(value, (k, e, op, v, i) => {
            this.handleOperators(qb, k, op, i, v);
          });
        })
      );
    }
  }
}

