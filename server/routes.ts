import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Authing, Commenting, Communitying, Friending, Posting, Sessioning } from "./app";
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
  @Router.validate(z.object({ target: z.string().optional() }))
  async getComments(target?: string) {
    let comments;
    if (target) {
      const id = new ObjectId(target);
      comments = await Commenting.getByTarget(id);
    } else {
      comments = await Commenting.getComments();
    }
    return Responses.comments(comments);
  }

  @Router.post("/comments")
  async createComment(session: SessionDoc, content: string, target: string) {
    const user = Sessioning.getUser(session);
    await Posting.assertPostExists(new ObjectId(target));
    const created = await Commenting.create(user, content, new ObjectId(target));
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
  async getCommunities() {
    return await Communitying.getCommunities();
  }

  @Router.post("/communities")
  async createCommunity(session: SessionDoc, name: string, description: string) {
    const user = Sessioning.getUser(session);
    return await Communitying.create(name, description, user);
  }

  @Router.get("/communities/:name")
  @Router.validate(z.object({ name: z.string().min(1) }))
  async getCommunityByName(name: string) {
    return await Communitying.getByName(name);
  }

  @Router.get("/communities/user/:id")
  async getCommunitiesByUser(id: string) {
    return await Communitying.getCommunitiesByUser(new ObjectId(id));
  }

  @Router.put("/communities/join/:id")
  async joinCommunity(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    return await Communitying.join(new ObjectId(id), user);
  }

  @Router.put("/communities/leave/:id")
  async leaveCommunity(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    return await Communitying.leave(new ObjectId(id), user);
  }

  @Router.post("/goals/community")
  async createCommunityGoal(communityId: string, name: String, unit: String, amount: Number, deadline: Date) {
    //blank for now
  }

  @Router.post("/goals/user")
  async createUserGoal(session: SessionDoc, name: String, unit: String, amount: Number, deadline: Date) {
    //blank for now
  }

  @Router.patch("/goals/community/:id")
  async updateCommunityGoal(id: string, name: String, unit: String, amount: Number, deadline: Date) {
    //blank for now
  }

  @Router.patch("/goals/user/:id")
  async updateUserGoal(id: string, name: String, unit: String, amount: Number, deadline: Date) {
    //blank for now
  }

  @Router.delete("/goals/community/:id")
  async deleteCommunityGoal(id: string) {
    //blank for now
  }

  @Router.delete("/goals/user/:id")
  async deleteUserGoal(id: string) {
    //blank for now
  }

  @Router.patch("/goals/community/progress/:id")
  async updateCommunityGoalProgress(id: string, progress: Number) {
    //blank for now
  }

  @Router.patch("/goals/user/progress/:id")
  async updateUserGoalProgress(id: string, progress: Number) {
    //blank for now
  }

  @Router.get("/goals/community")
  @Router.validate(z.object({ community: z.string().optional() }))
  async getCommunityGoals() {
    //blank for now
  }

  @Router.get("/goals/user")
  @Router.validate(z.object({ author: z.string().optional() }))
  async getUserGoals() {
    //blank for now
  }

  // question: reading said we should not have maps to booleans (isCompleted) as states (instead keep a set of completed goals)
  // how to implement this in the context of the goals? how to complete a goal? (how to add this exact goal object to another mongo collection?)
  @Router.patch("/goals/community/complete/:id")
  async completeCommunityGoal(id: string) {
    //blank for now
  }

  @Router.patch("/goals/user/complete/:id")
  async completeUserGoal(id: string) {
    //blank for now
  }

  @Router.post("/collections")
  async createUserCollection(session: SessionDoc, name: String, description: String) {
    //blank for now
  }

  @Router.post("/collections/globalLibrary")
  async createGlobalLibraryCollection(name: String, description: String) {
    //blank for now
  }

  @Router.get("/collections")
  @Router.validate(z.object({ author: z.string().optional() }))
  async getCollections(session: SessionDoc) {
    //blank for now
  }

  @Router.patch("/collections/addPost/:id")
  async addPostToCollection(session: SessionDoc, id: string, postId: string) {
    //blank for now
  }

  @Router.patch("/collections/removePost/:id")
  async removePostFromCollection(session: SessionDoc, id: string, postId: string) {
    //blank for now
  }

  @Router.delete("/collections/:id")
  async deleteCollection(session: SessionDoc, id: string) {
    //blank for now
  }
}

/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);
