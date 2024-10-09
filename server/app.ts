import AuthenticatingConcept from "./concepts/authenticating";
import CollectioningConcept from "./concepts/collectioning";
import CommentingConcept from "./concepts/commenting";
import CommunityingConcept from "./concepts/communitying";
import FriendingConcept from "./concepts/friending";
import PostingConcept from "./concepts/posting";
import SessioningConcept from "./concepts/sessioning";
import GoalingConcept from "./concepts/goaling";

// The app is a composition of concepts instantiated here
// and synchronized together in `routes.ts`.
export const Sessioning = new SessioningConcept();
export const Authing = new AuthenticatingConcept("users");
export const Posting = new PostingConcept("posts");
export const Friending = new FriendingConcept("friends");
export const Commenting = new CommentingConcept("comments");
export const Communitying = new CommunityingConcept("communities");
export const Collectioning = new CollectioningConcept("collections");
export const UserGoaling = new GoalingConcept("userGoals");
export const CommunityGoaling = new GoalingConcept("communityGoals");
