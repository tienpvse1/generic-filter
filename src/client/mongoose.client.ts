/* eslint-disable @typescript-eslint/ban-types */
import mongoose, { Model, PipelineStage, isValidObjectId } from "mongoose";
import { PartialDeep } from "type-fest";
import { IArgs, OperatorKey } from "../interfaces/filter";
import { BaseService } from "../interfaces/service";

export class MongooseService<Entity> extends BaseService<
  Entity,
  Model<Entity>
> {
  // this can be useful when it comes to handle transaction stuff, optional however!
  protected connection?: mongoose.Connection;

  constructor(repository: Model<Entity>, connection?: mongoose.Connection) {
    super(repository);
    this.connection = connection;
  }

  async isExists(args: IArgs<Entity>): Promise<boolean> {
    const result = await this.findOne(args);
    return result != null;
  }

  create(args: PartialDeep<Entity>): Promise<Entity> {
    return this.repository.create(args);
  }

  async findOne(args: IArgs<Entity>): Promise<Entity> {
    const pipeline: PipelineStage.Match["$match"] = {};
    this.loop(args.where, (key, _, operator, value) => {
      this.handleOperators(pipeline, key, operator, value);
    });
    const found = await this.repository.aggregate([{ $match: pipeline }]);
    return found[0];
  }

  async find(args: IArgs<Entity>): Promise<Entity[]> {
    const pipeline: PipelineStage.Match["$match"] = {};
    this.loop(args.where, (key, _, operator, value) => {
      this.handleOperators(pipeline, key, operator, value);
    });
    return this.repository.aggregate([{ $match: pipeline }]);
  }

  handleOperators(
    pipeline: PipelineStage.Match["$match"],
    key: string,
    operator: OperatorKey,
    value: any
  ) {
    if (operator === "eq") pipeline[key] = { $eq: this.handleObjectId(value) };
    if (operator === "ne") pipeline[key] = { $ne: this.handleObjectId(value) };
    if (operator === "gt") pipeline[key] = { $gt: value };
    if (operator === "gte") pipeline[key] = { $gte: value };
    if (operator === "in") pipeline[key] = { $in: this.handleObjectId(value) };
    if (operator === "isNull" && value) pipeline[key] = { $eq: null };
    if (operator === "isNull" && !value) pipeline[key] = { $ne: null };
    if (operator === "lt") pipeline[key] = { $lt: value };
    if (operator === "lte") pipeline[key] = { $lte: value };
    if (operator === "nin")
      pipeline[key] = { $nin: this.handleObjectId(value) };
    if (operator === "or") {
      const orCondition: PipelineStage.Match["$match"]["$or"] = [];
      for (const whereCondition of value) {
        this.loop(whereCondition, (key, _, operator, value) => {
          orCondition.push(this.handleOperators({}, key, operator, value));
        });
      }
      pipeline.$or = orCondition;
    }
    if (operator === "and") {
      const andConditions: PipelineStage.Match["$match"]["$and"] = [];
      for (const whereCondition of value) {
        this.loop(whereCondition, (key, _, operator, value) => {
          andConditions.push(this.handleOperators({}, key, operator, value));
        });
      }
      pipeline.$and = andConditions;
    }
    return pipeline;
  }

  protected handleObjectId(id: string): mongoose.Schema.Types.ObjectId;
  protected handleObjectId(id: string[]): mongoose.Schema.Types.ObjectId[];
  protected handleObjectId(id: any): any {
    if (typeof id === "string" && isValidObjectId(id))
      return new mongoose.Types.ObjectId(id.toString());

    return id.map((item: string) => {
      if (isValidObjectId(item)) {
        return new mongoose.Types.ObjectId(item.toString());
      }
    });
  }
}

