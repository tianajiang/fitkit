import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface CollectionDoc extends BaseDoc {
  name: string;
  owner: ObjectId | null; // for the global library its null
  posts: ObjectId[];
}

/**
 * concept: Collectioning [User, Post]
 */
export default class CollectioningConcept {
  public readonly collections: DocCollection<CollectionDoc>;

  /**
   * Make an instance of Collectioning.
   */
  constructor(collectionName: string) {
    this.collections = new DocCollection<CollectionDoc>(collectionName);
  }

  async create(name: string, owner: ObjectId|null) {
    if (!name) {
      throw new NotAllowedError("Collection name cannot be empty!");
    }
    const _id = await this.collections.createOne({ name, owner, posts: [] });
    return { msg: "Collection successfully created!", community: await this.collections.readOne({ _id }) };
  }

  async getCollections() {
    // Returns all collections! You might want to page for better client performance
    return await this.collections.readMany({}, { sort: { _id: -1 } });
  }

  // return all the collections owned by user
  async getCollectionsByUser(user: ObjectId) {
    return await this.collections.readMany({ owner: user });
  }

  async getCollectionsByPostAndUser(user: ObjectId, post: ObjectId) {
    // Returns all collections owned by user that contain the post
    return await this.collections.readMany({ owner: user, posts: post });
  }

  async addPost(_id: ObjectId, post: ObjectId) {
    const collection = await this.collections.readOne({ _id });
    if (!collection) {
      throw new NotFoundError(`Collection ${_id} does not exist!`);
    }
    //check if post already in collection
    for (const p of collection.posts) {
      if (p.toString() === post.toString()) {
        throw new NotAllowedError(`Post ${post} is already in collection ${_id}!`);
      }
    }
    collection.posts.push(post);
    await this.collections.partialUpdateOne({ _id }, collection);
    return { msg: "Post successfully added to collection!" };
  }

  async removePost(_id: ObjectId, post: ObjectId) {
    const collection = await this.collections.readOne({ _id });
    if (!collection) {
      throw new NotFoundError(`Collection ${_id} does not exist!`);
    }
    collection.posts = collection.posts.filter((p) => p.toString() !== post.toString());
    await this.collections.partialUpdateOne({ _id }, collection);
    return { msg: "Post successfully removed from collection!" };
  }

  async deleteCollection(_id: ObjectId) {
    await this.collections.deleteOne({ _id });
    return { msg: "Collection successfully deleted!" };
  }

  async assertUserCanEditCollection(_id: ObjectId, user: ObjectId) {
    const collection = await this.collections.readOne({ _id });
    if (!collection) {
      throw new NotFoundError(`Collection ${_id} does not exist!`);
    }
    if (collection.owner === null || collection.owner.toString() === user.toString()) {
      return;
    } else {
      throw new UserNotCollectionOwnerError(user, _id);
    }
  }

  async assertUserCanDeleteCollection(_id: ObjectId, user: ObjectId) {
    const collection = await this.collections.readOne({ _id });
    if (!collection) {
      throw new NotFoundError(`Collection ${_id} does not exist!`);
    }
    if (collection.owner === null || collection.owner.toString() !== user.toString()) {
      throw new UserNotCollectionOwnerError(user, _id);
    }
  }
}

export class UserNotCollectionOwnerError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not allowed to edit collection {1}!", author, _id);
  }
}

