import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface CommunityDoc extends BaseDoc {
  name: string;
  description: string;
  members: ObjectId[];
  posts: ObjectId[];
}

/**
 * concept: Communitying [User, Item]
 */
export default class CommunityingConcept {
  public readonly communities: DocCollection<CommunityDoc>;

  /**
   * Make an instance of Communitying.
   */
  constructor(collectionName: string) {
    this.communities = new DocCollection<CommunityDoc>(collectionName);
  }

  async create(name: string, description: string, creator: ObjectId) {
    const _id = await this.communities.createOne({ name, description, members: [creator], posts: [] });
    return { msg: "Community successfully created!", community: await this.communities.readOne({ _id }) };
  }

  async getCommunities() {
    // Returns all communities! You might want to page for better client performance
    return await this.communities.readMany({}, { sort: { _id: -1 } });
  }

  async getByName(name: string) {
    return await this.communities.readMany({ name });
  }

  // return all the communities where member contains user
  async getCommunitiesByUser(user: ObjectId) {
    return await this.communities.readMany({ members: user });
  }

  async getCommunityByPost(post: ObjectId) {
    return await this.communities.readOne({ posts: post });
  }

  async addPost(_id: ObjectId, post: ObjectId) {
    const community = await this.communities.readOne({ _id });
    if (!community) {
      throw new NotFoundError(`Community ${_id} does not exist!`);
    }
    community.posts.push(post);
    await this.communities.partialUpdateOne({ _id }, community);
    return { msg: "Post successfully added to community!" };
  }

  async removePost(_id: ObjectId, post: ObjectId) {
    const community = await this.communities.readOne({ _id });
    if (!community) {
      throw new NotFoundError(`Community ${_id} does not exist!`);
    }
    community.posts = community.posts.filter((p) => p !== post);
    await this.communities.partialUpdateOne({ _id }, community);
    return { msg: "Post successfully removed from community!" };
  }

  async join(_id: ObjectId, user: ObjectId) {
    const community = await this.communities.readOne({ _id });
    if (!community) {
      throw new NotFoundError(`Community ${_id} does not exist!`);
    }
    for (const member of community.members) {
      if (member.toString() === user.toString()) {
        throw new NotAllowedError(`User ${user} is already a member of community ${_id}!`);
      }
    }
    community.members.push(user);
    await this.communities.partialUpdateOne({ _id }, community);
    return { msg: "User successfully joined community!" };
  }

  async leave(_id: ObjectId, user: ObjectId) {
    const community = await this.communities.readOne({ _id });
    if (!community) {
      throw new NotFoundError(`Community ${_id} does not exist!`);
    }
    let isMember = false;
    for (const member of community.members) {
      if (member.toString() === user.toString()) {
        isMember = true;
        break;
      }
    }
    if (!isMember) {
      throw new NotAllowedError(`User ${user} is not a member of community ${_id}!`);
    }
    community.members = community.members.filter((member) => member.toString() !== user.toString());
    await this.communities.partialUpdateOne({ _id }, community);
    return { msg: "User successfully left community!" };
  }

  async assertUserIsMember(_id: ObjectId, user: ObjectId) {
    const community = await this.communities.readOne({ _id });
    if (!community) {
      throw new NotFoundError(`Community ${_id} does not exist!`);
    }
    let isMember = false;
    for (const member of community.members) {
      if (member.toString() === user.toString()) {
        isMember = true;
        break;
      }
    }
    if (!isMember) {
      throw new NotAllowedError(`User ${user} is not a member of community ${_id}!`);
    }
  }
}
