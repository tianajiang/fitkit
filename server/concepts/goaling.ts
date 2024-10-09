import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface GoalDoc extends BaseDoc {
  author: ObjectId;
  name: string;
  unit: string;
  amount: number;
  progress: number;
  creationDate: Date;
  targetCompletionDate: Date;
}

/**
 * concept: Goaling [User, Community]
 */
export default class GoalingConcept {
  public readonly incompleteGoals: DocCollection<GoalDoc>;
  public readonly completeGoals: DocCollection<GoalDoc>;

  /**
   * Make an instance of Goaling.
   */
  constructor(collectionName: string) {
    this.incompleteGoals = new DocCollection<GoalDoc>(collectionName + "incomplete");
    this.completeGoals = new DocCollection<GoalDoc>(collectionName + "complete");
  }

  async create(author: ObjectId, name: string, unit: string, amount: number, targetCompletionDate: Date) {
    const _id = await this.incompleteGoals.createOne({ author, name, unit, amount, progress: 0, creationDate: new Date(), targetCompletionDate });
    return { msg: "Goal successfully created!", goal: await this.incompleteGoals.readOne({ _id }) };
  }

  async getCompleteGoals() {
    return await this.completeGoals.readMany({}, { sort: { _id: -1 } });
  }

  async getIncompleteGoals() {
    return await this.incompleteGoals.readMany({}, { sort: { _id: -1 } });
  }

  async getIncompleteByAuthor(author: ObjectId) {
    return await this.incompleteGoals.readMany({ author });
  }

  async getCompleteByAuthor(author: ObjectId) {
    return await this.completeGoals.readMany({ author });
  }

  async getGoal(_id: ObjectId) {
    const goal = await this.incompleteGoals.readOne({ _id });
    if (!goal) {
      throw new NotFoundError(`Goal ${_id} does not exist!`);
    }
    const incomplete = await this.incompleteGoals.readOne({ _id });
    const complete = await this.completeGoals.readOne({ _id });
    if (incomplete) {
      return incomplete;
    } else if (complete) {
      return complete;
    } else {
      throw new NotFoundError(`Goal ${_id} does not exist!`);
    }
}

  async update(_id: ObjectId, name?: string, unit?: string, amount?: number, targetCompletionDate?: Date) {
    const goal = await this.incompleteGoals.readOne({ _id });
    if (!goal) {
      throw new NotFoundError(`Goal ${_id} does not exist!`);
    }
    const updatedFields: Partial<GoalDoc> = {};
    if (name !== undefined) {
      updatedFields.name = name;
    }
    if (unit !== undefined) {
      updatedFields.unit = unit;
    }
    if (amount !== undefined) {
      updatedFields.amount = amount;
    }
    if (targetCompletionDate !== undefined) {
      updatedFields.targetCompletionDate = targetCompletionDate;
    }
    await this.incompleteGoals.partialUpdateOne({ _id }, updatedFields);
    return { msg: "Goal updated successfully!", goal: await this.incompleteGoals.readOne({ _id }) };
  }

  async addProgress(_id: ObjectId, progress: number) {
    const goal = await this.incompleteGoals.readOne({ _id });
    if (!goal) {
      throw new NotFoundError(`Goal ${_id} does not exist!`);
    }
    goal.progress += progress;
    await this.incompleteGoals.partialUpdateOne({ _id }, { progress: goal.progress });
    if (goal.progress >= goal.amount) {
      await this.completeGoal(_id);
    }
    return { msg: "Progress added successfully!" };
  }

  async completeGoal(_id: ObjectId) {
    const goal = await this.incompleteGoals.readOne({ _id });
    if (!goal) {
      throw new NotFoundError(`Goal ${_id} does not exist!`);
    }
    await this.incompleteGoals.deleteOne({ _id });
    await this.completeGoals.createOne(goal);
    return { msg: "Goal completed successfully!" };
  }

  async deleteIncompleteGoal(_id: ObjectId) {
    const goal = await this.incompleteGoals.readOne({ _id });
    if (!goal) {
      throw new NotFoundError(`Goal ${_id} does not exist!`);
    }
    await this.incompleteGoals.deleteOne({ _id });
    return { msg: "Goal deleted successfully!" };
  }

  async assertUserIsGoalAuthor(_id: ObjectId, user: ObjectId) {
    const goal = await this.incompleteGoals.readOne({ _id });
    if (!goal) {
      throw new NotFoundError(`Goal ${_id} does not exist!`);
    }
    if (goal.author.toString() === user.toString()) {
      return;
    } else {
      throw new UserNotGoalAuthorError(user, _id);
    }
  }
}

export class UserNotGoalAuthorError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of post {1}!", author, _id);
  }
}


