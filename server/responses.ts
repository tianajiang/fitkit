import { Authing, Communitying } from "./app";
import { CommentDoc, CommentAuthorNotMatchError } from "./concepts/commenting";
import { AlreadyFriendsError, FriendNotFoundError, FriendRequestAlreadyExistsError, FriendRequestDoc, FriendRequestNotFoundError } from "./concepts/friending";
import { PostAuthorNotMatchError, PostDoc } from "./concepts/posting";
import { Router } from "./framework/router";
import { CommunityDoc } from "./concepts/communitying";
import { UserNotCollectionOwnerError, CollectionDoc } from "./concepts/collectioning";
import { UserNotGoalAuthorError, GoalDoc } from "./concepts/goaling";

/**
 * This class does useful conversions for the frontend.
 * For example, it converts a {@link PostDoc} into a more readable format for the frontend.
 */
export default class Responses {
  /**
   * Convert PostDoc into more readable format for the frontend by converting the author id into a username.
   */
  static async post(post: PostDoc | null) {
    if (!post) {
      return post;
    }
    const author = await Authing.getUserById(post.author);
    return { ...post, author: author.username };
  }

  /**
   * Same as {@link post} but for an array of PostDoc for improved performance.
   */
  static async posts(posts: PostDoc[]) {
    const authors = await Authing.idsToUsernames(posts.map((post) => post.author));
    return posts.map((post, i) => ({ ...post, author: authors[i] }));
  }

  /**
   * Convert CommentDoc into more readable format for the frontend by converting the author id into a username.
   */
  static async comment(comment: CommentDoc | null) {
    if (!comment) {
      return comment;
    }
    const author = await Authing.getUserById(comment.author);
    return { ...comment, author: author.username };
  }

  /**
   * Same as {@link comment} but for an array of CommentDoc for improved performance.
   */
  static async comments(comments: CommentDoc[]) {
    const authors = await Authing.idsToUsernames(comments.map((comment) => comment.author));
    return comments.map((comment, i) => ({ ...comment, author: authors[i] }));
  }

  /**
   * Convert FriendRequestDoc into more readable format for the frontend
   * by converting the ids into usernames.
   */
  static async friendRequests(requests: FriendRequestDoc[]) {
    const from = requests.map((request) => request.from);
    const to = requests.map((request) => request.to);
    const usernames = await Authing.idsToUsernames(from.concat(to));
    return requests.map((request, i) => ({ ...request, from: usernames[i], to: usernames[i + requests.length] }));
  }

  // convert CommunityDoc into more readable format for the frontend
  static async community(community: CommunityDoc | null) {
    if (!community) {
      return community;
    }
    const members = await Authing.idsToUsernames(community.members);
    return { ...community, members };
  }

  // convert an array of CommunityDoc into more readable format for the frontend
  static async communities(communities: CommunityDoc[]) {
    const members = await Promise.all(communities.map((community) => Authing.idsToUsernames(community.members)));
    return communities.map((community, i) => ({ ...community, members: members[i] }));
  }

  // convert CollectionDoc into more readable format for the frontend
  static async collection(collection: CollectionDoc | null) {
    if (!collection) {
      return collection;
    }
    if (collection.owner) {
      const owner = await Authing.getUserById(collection.owner);
      return { ...collection, owner: owner.username };
    }
    return collection;
  }

  // convert an array of CollectionDoc into more readable format for the frontend
  static async collections(collections: CollectionDoc[]) {
    const owners = await Promise.all(collections.map((collection) => collection.owner ? Authing.getUserById(collection.owner) : null));
    return collections.map((collection, i) => collection.owner ? { ...collection, owner: owners[i]?.username } : collection);
  }

  // convert GoalDoc into more readable format for the frontend
  static async communityGoal(goal: GoalDoc | null) {
    if (!goal) {
      return goal;
    }
    const author = await Communitying.getCommunity(goal.author);
    if (!author) {
      return goal;
    }
    return { ...goal, author: author.name };
  }

  // convert an array of GoalDoc into more readable format for the frontend
  static async communityGoals(goals: GoalDoc[]) {
    const authors = await Promise.all(goals.map((goal) => Communitying.getCommunity(goal.author)));
    return goals.map((goal, i) => ({ ...goal, author: authors[i]?.name }));
  }

  // convert GoalDoc into more readable format for the frontend
  static async userGoal(goal: GoalDoc | null) {
    if (!goal) {
      return goal;
    }
    const author = await Authing.getUserById(goal.author);
    return { ...goal, author: author.username };
  }

  // convert an array of GoalDoc into more readable format for the frontend
  static async userGoals(goals: GoalDoc[]) {
    const authors = await Authing.idsToUsernames(goals.map((goal) => goal.author));
    return goals.map((goal, i) => ({ ...goal, author: authors[i] }));
  }
}

Router.registerError(PostAuthorNotMatchError, async (e) => {
  const username = (await Authing.getUserById(e.author)).username;
  return e.formatWith(username, e._id);
});

Router.registerError(FriendRequestAlreadyExistsError, async (e) => {
  const [user1, user2] = await Promise.all([Authing.getUserById(e.from), Authing.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FriendNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([Authing.getUserById(e.user1), Authing.getUserById(e.user2)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FriendRequestNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([Authing.getUserById(e.from), Authing.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(AlreadyFriendsError, async (e) => {
  const [user1, user2] = await Promise.all([Authing.getUserById(e.user1), Authing.getUserById(e.user2)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(CommentAuthorNotMatchError, async (e) => {
  const username = (await Authing.getUserById(e.author)).username;
  return e.formatWith(username, e._id);
});

Router.registerError(UserNotCollectionOwnerError, async (e) => {
  const username = (await Authing.getUserById(e.author)).username;
  return e.formatWith(username, e._id);
});

Router.registerError(UserNotGoalAuthorError, async (e) => {
  // if owner is an author, input author name. if owner is a community, 
  const username = (await Authing.getUserById(e.author)).username;
  return e.formatWith(username, e._id);
});
