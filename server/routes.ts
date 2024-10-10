import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Authing, Commenting, Communitying, Friending, Posting, Sessioning, Collectioning, UserGoaling, CommunityGoaling } from "./app";
import { PostOptions } from "./concepts/posting";
import { SessionDoc } from "./concepts/sessioning";
import Responses from "./responses";

import { z } from "zod";

/**
 * Web server routes for the app. Implements synchronizations between concepts.
 */
class Routes {
  // Synchronize the concepts from `app.ts`.

  @Router.get("/session")
  async getSessionUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await Authing.getUsers();
  }

  @Router.get("/users/:username")
  @Router.validate(z.object({ username: z.string().min(1) }))
  async getUser(username: string) {
    return await Authing.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: SessionDoc, username: string, password: string) {
    Sessioning.isLoggedOut(session);
    return await Authing.create(username, password);
  }

  @Router.patch("/users/username")
  async updateUsername(session: SessionDoc, username: string) {
    const user = Sessioning.getUser(session);
    return await Authing.updateUsername(user, username);
  }

  @Router.patch("/users/password")
  async updatePassword(session: SessionDoc, currentPassword: string, newPassword: string) {
    const user = Sessioning.getUser(session);
    return Authing.updatePassword(user, currentPassword, newPassword);
  }

  @Router.delete("/users")
  async deleteUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    Sessioning.end(session);
    return await Authing.delete(user);
  }

  @Router.post("/login")
  async logIn(session: SessionDoc, username: string, password: string) {
    const u = await Authing.authenticate(username, password);
    Sessioning.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: SessionDoc) {
    Sessioning.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  @Router.validate(z.object({ author: z.string().optional() }))
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await Authing.getUserByUsername(author))._id;
      posts = await Posting.getByAuthor(id);
    } else {
      posts = await Posting.getPosts();
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: SessionDoc, content: string, communityId: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    await Communitying.assertUserIsMember(new ObjectId(communityId), user);
    const created = await Posting.create(user, content, options);
    if (created.post) {
      await Communitying.addPost(new ObjectId(communityId), created.post._id);
    }
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:id")
  async updatePost(session: SessionDoc, id: string, content?: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    return await Posting.update(oid, content, options);
  }

  @Router.delete("/posts/:id")
  async deletePost(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    //remove post from its community
    const community = await Communitying.getCommunityByPost(oid);
    if (community) {
      await Communitying.removePost(community._id, oid);
    }
    return Posting.delete(oid);
  }

  @Router.get("/friends")
  async getFriends(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.idsToUsernames(await Friending.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: SessionDoc, friend: string) {
    const user = Sessioning.getUser(session);
    const friendOid = (await Authing.getUserByUsername(friend))._id;
    return await Friending.removeFriend(user, friendOid);
  }

  @Router.get("/friend/requests")
  async getRequests(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Responses.friendRequests(await Friending.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.sendRequest(user, toOid);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.removeRequest(user, toOid);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.acceptRequest(fromOid, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.rejectRequest(fromOid, user);
  }

  @Router.get("/comments")
  @Router.validate(z.object({ targetId: z.string().optional() }))
  async getComments(targetId?: string) {
    let comments;
    if (targetId) {
      const id = new ObjectId(targetId);
      comments = await Commenting.getByTarget(id);
    } else {
      comments = await Commenting.getComments();
    }
    return Responses.comments(comments);
  }

  @Router.post("/comments")
  async createComment(session: SessionDoc, content: string, targetId: string) {
    const user = Sessioning.getUser(session);
    await Posting.assertPostExists(new ObjectId(targetId));
    const created = await Commenting.create(user, content, new ObjectId(targetId));
    return { msg: created.msg, comment: await Responses.comment(created.comment) };
  }

  @Router.patch("/comments/:id")
  async updateComment(session: SessionDoc, id: string, content?: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Commenting.assertAuthorIsUser(oid, user);
    return await Commenting.update(oid, content);
  }

  @Router.delete("/comments/:id")
  async deleteComment(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Commenting.assertAuthorIsUser(oid, user);
    return Commenting.delete(oid);
  }

  @Router.get("/communities")
  @Router.validate(z.object({ name: z.string().optional() }))
  async getCommunities(name?: string) {
    if (name) {
      return await Responses.communities(await Communitying.getByName(name));
    }
    return await Responses.communities(await Communitying.getCommunities());
  }

  @Router.post("/communities")
  async createCommunity(session: SessionDoc, name: string, description: string) {
    const user = Sessioning.getUser(session);
    const created = await Communitying.create(name, description, user);
    return { msg: created.msg, community: await Responses.community(created.community) };
  }

  @Router.get("/communities/user/:id")
  async getCommunitiesByUser(userId: string) {
    const communities = await Communitying.getCommunitiesByUser(new ObjectId(userId));
    return Responses.communities(communities);
  }

  @Router.get("/communities/search")
  @Router.validate(z.object({ keyword: z.string() }))
  async searchCommunitiesByKeyword(keyword: string) {
    return await Responses.communities(await Communitying.searchCommunitiesByKeyword(keyword));
  }

  @Router.put("/communities/join/:id")
  async joinCommunity(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    await Communitying.assertUserIsNotMember(new ObjectId(id), user);
    return await Communitying.join(new ObjectId(id), user);
  }

  @Router.put("/communities/leave/:id")
  async leaveCommunity(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    await Communitying.assertUserIsMember(new ObjectId(id), user);
    return await Communitying.leave(new ObjectId(id), user);
  }

  @Router.post("/goals/community")
  async createCommunityGoal(session: SessionDoc, communityId: string, name: string, unit: string, amount: string, deadline: string) {
    const user = Sessioning.getUser(session);
    const amt = parseInt(amount);
    if (Number.isNaN(amt)) {
      throw new Error("Amount must be a number!");
    }
    const ddln = new Date(deadline);
    await Communitying.assertUserIsMember(new ObjectId(communityId), user);
    return await CommunityGoaling.create(new ObjectId(communityId), name, unit, amt, ddln);
  }

  @Router.post("/goals/user")
  async createUserGoal(session: SessionDoc, name: string, unit: string, amount: string, deadline: string) {
    const user = Sessioning.getUser(session);
    const amt = parseInt(amount);
    if (Number.isNaN(amt)) {
      throw new Error("Amount must be a number!");
    }
    const ddln = new Date(deadline);
    return await UserGoaling.create(user, name, unit, amt, ddln);
  }

  @Router.patch("/goals/community/:id")
  async updateCommunityGoal(session: SessionDoc, id: string, name?: string, unit?: string, amount?: string, deadline?: string) {
    const user = Sessioning.getUser(session);
    const goal = await CommunityGoaling.getGoal(new ObjectId(id));
    const community = await Communitying.getCommunity(goal.author);
    await Communitying.assertUserIsMember(community._id, user);
    const amt = amount ? parseInt(amount) : undefined;
    const ddln = deadline ? new Date(deadline) : undefined;
    return await CommunityGoaling.update(new ObjectId(id), name, unit, amt, ddln);
  }

  @Router.patch("/goals/user/:id")
  async updateUserGoal(session: SessionDoc, id: string, name?: string, unit?: string, amount?: string, deadline?: string) {
    const user = Sessioning.getUser(session);
    await UserGoaling.assertUserIsGoalAuthor(new ObjectId(id), user);
    const amt = amount ? parseInt(amount) : undefined;
    const ddln = deadline ? new Date(deadline) : undefined;
    return await UserGoaling.update(new ObjectId(id), name, unit, amt, ddln);
  }

  @Router.delete("/goals/community/:id")
  async deleteCommunityGoal(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const goal = await CommunityGoaling.getGoal(new ObjectId(id));
    const community = await Communitying.getCommunity(goal.author);
    await Communitying.assertUserIsMember(community._id, user);
    return await CommunityGoaling.deleteIncompleteGoal(new ObjectId(id));
  }

  @Router.delete("/goals/user/:id")
  async deleteUserGoal(session:SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    await UserGoaling.assertUserIsGoalAuthor(new ObjectId(id), user);
    return await UserGoaling.deleteIncompleteGoal(new ObjectId(id));
  }

  @Router.patch("/goals/community/:id/progress")
  async addCommunityGoalProgress(session: SessionDoc, id: string, progress: string) {
    const user = Sessioning.getUser(session);
    const goal = await CommunityGoaling.getGoal(new ObjectId(id));
    const community = await Communitying.getCommunity(goal.author);
    await Communitying.assertUserIsMember(community._id, user);
    const prog = parseInt(progress);
    if (Number.isNaN(prog)) {
      throw new Error("Amount must be a number!");
    }
    return await CommunityGoaling.addProgress(new ObjectId(id), prog);
  }

  @Router.patch("/goals/user/:id/progress/")
  async addUserGoalProgress(session: SessionDoc, id: string, progress: string) {
    const user = Sessioning.getUser(session);
    await UserGoaling.assertUserIsGoalAuthor(new ObjectId(id), user);
    const prog = parseInt(progress);
    if (Number.isNaN(prog)) {
      throw new Error("Amount must be a number!");
    }
    return await UserGoaling.addProgress(new ObjectId(id), prog);
  }

  @Router.get("/goals/complete/community")
  @Router.validate(z.object({ communityId: z.string().optional() }))
  async getCompleteCommunityGoals(communityId?: string) {
    if (communityId) {
      const community = await Communitying.getCommunity(new ObjectId(communityId));
      if (!community) {
        throw new Error("Community not found!");
      }
      return await CommunityGoaling.getCompleteByAuthor(new ObjectId(communityId));
    }
    return await CommunityGoaling.getCompleteGoals();
  }

  @Router.get("/goals/incomplete/community")
  @Router.validate(z.object({ communityId: z.string().optional() }))
  async getIncompleteCommunityGoals(communityId?: string) {
    if (communityId) {
      const community = await Communitying.getCommunity(new ObjectId(communityId));
      if (!community) {
        throw new Error("Community not found!");
      }
      return await CommunityGoaling.getIncompleteByAuthor(new ObjectId(communityId));
    }
    return await CommunityGoaling.getIncompleteGoals();
  }

  @Router.get("/goals/complete/user")
  @Router.validate(z.object({ authorId: z.string().optional() }))
  async getCompleteUserGoals(authorId?: string) {
    if (authorId) {
      Authing.assertUserExists(new ObjectId(authorId));
      return await UserGoaling.getCompleteByAuthor(new ObjectId(authorId));
    }
    return await UserGoaling.getCompleteGoals();
  }

  @Router.get("/goals/incomplete/user")
  @Router.validate(z.object({ authorId: z.string().optional() }))
  async getIncompleteUserGoals(authorId?: string) {
    if (authorId) {
      Authing.assertUserExists(new ObjectId(authorId));
      return await UserGoaling.getIncompleteByAuthor(new ObjectId(authorId));
    }
    return await UserGoaling.getIncompleteGoals();
  }

  @Router.post("/collections")
  async createUserCollection(session: SessionDoc, name: string) {
    const user = Sessioning.getUser(session);
    return await Collectioning.create(name, user);
  }

  @Router.post("/collections/globalLibrary")
  async createGlobalLibraryCollection() {
    return await Collectioning.create("Global Exercise Library", null);
  }

  @Router.get("/collections")
  @Router.validate(z.object({ ownerId: z.string().optional() }))
  async getCollections(ownerId?: string) {
    let collections;
    if (ownerId) {
      collections = await Collectioning.getCollectionsByUser(new ObjectId(ownerId));
    } else {
      collections = await Collectioning.getCollections();
    }
    return collections;
  }

  @Router.get("/collections/user/:id/post/:postId")
  async getCollectionsByPostAndUser(ownerId: string, postId: string) {
    const collections = await Collectioning.getCollectionsByPostAndUser(new ObjectId(ownerId), new ObjectId(postId));
    return collections;
  }

  @Router.patch("/collections/addPost/:id")
  async addPostToCollection(session: SessionDoc, id: string, postId: string) {
    const user = Sessioning.getUser(session);
    await Collectioning.assertUserCanEditCollection(new ObjectId(id), user);
    return await Collectioning.addPost(new ObjectId(id), new ObjectId(postId));
  }

  @Router.patch("/collections/removePost/:id")
  async removePostFromCollection(session: SessionDoc, id: string, postId: string) {
    const user = Sessioning.getUser(session);
    await Collectioning.assertUserCanEditCollection(new ObjectId(id), user);
    return await Collectioning.removePost(new ObjectId(id), new ObjectId(postId));
  }

  @Router.delete("/collections/:id")
  async deleteCollection(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    await Collectioning.assertUserCanDeleteCollection(new ObjectId(id), user);
    return await Collectioning.deleteCollection(new ObjectId(id));
  }
}

/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);
