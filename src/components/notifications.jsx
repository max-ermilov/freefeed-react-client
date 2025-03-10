/* global CONFIG */
import { useMemo } from 'react';
import { connect, useSelector } from 'react-redux';
import { Link } from 'react-router';

import { Throbber } from './throbber';
import Linkify from './linkify';
import TimeDisplay from './time-display';
import PaginatedView from './paginated-view';
import ErrorBoundary from './error-boundary';
import UserName from './user-name';
import { SignInLink } from './sign-in-link';

const getAuthorName = ({ postAuthor, createdUser, group }) => {
  if (group && group.username) {
    return group.username;
  }
  if (postAuthor && postAuthor.username) {
    return postAuthor.username;
  }
  return createdUser.username;
};

const generatePostUrl = ({ post_id, ...event }) => `/${getAuthorName(event)}/${post_id}`;
const generateCommentUrl = ({ post_id, comment_id, ...event }) =>
  `/${getAuthorName(event)}/${post_id}#comment-${comment_id}`;
const postLink = (event) =>
  event.post_id ? <Link to={generatePostUrl(event)}>post</Link> : 'deleted post';
const directPostLink = (event) =>
  event.post_id ? (
    <Link to={generatePostUrl(event)}>direct message</Link>
  ) : (
    'deleted direct message'
  );
const commentLink = (event, text = 'comment') =>
  event.comment_id ? (
    <Link to={generateCommentUrl(event)}>{text}</Link>
  ) : text === 'comment' ? (
    'deleted comment'
  ) : text === 'New comment' ? (
    'Deleted comment'
  ) : (
    text
  );
const backlinkLink = (event) =>
  event.target_comment_id ? (
    <Link to={`/post/${event.target_post_id}#comment-${event.target_comment_id}`}>comment</Link>
  ) : event.target_post_id ? (
    <Link to={`/post/${event.target_post_id}`}>post</Link>
  ) : (
    'deleted entry'
  );

const notificationTemplates = {
  subscription_request_revoked: (event) => (
    <Linkify>{`@${event.createdUser.username} revoked subscription request to you`}</Linkify>
  ),

  mention_in_post: (event) => (
    <div>
      <Linkify>{`@${event.createdUser.username} mentioned you in the `}</Linkify>
      {postLink(event)}
      <Linkify>{` ${event.group.username ? ` [in @${event.group.username}]` : ''}`}</Linkify>
    </div>
  ),
  mention_in_comment: (event) => (
    <div>
      <Linkify>{`@${event.createdUser.username} mentioned you in a `}</Linkify>
      {commentLink(event, 'comment')}
      {` to the `}
      {postLink(event)}
      <Linkify>{`${event.group.username ? ` [in @${event.group.username}]` : ''}`}</Linkify>
    </div>
  ),
  mention_comment_to: (event) => (
    <div>
      <Linkify>{`@${event.createdUser.username} `}</Linkify>
      {commentLink(event, 'replied')}
      {` to you in the `}
      {postLink(event)}
      <Linkify>{` ${event.group.username ? `[in @${event.group.username}]` : ''}`}</Linkify>
    </div>
  ),
  backlink_in_comment: (event) => (
    <div>
      <Linkify>{`@${event.createdUser.username}`}</Linkify> mentioned your {backlinkLink(event)} in
      a {commentLink(event, 'comment')}
      {` to the `}
      {postLink(event)}
      <Linkify>{`${event.group.username ? ` [in @${event.group.username}]` : ''}`}</Linkify>
    </div>
  ),
  backlink_in_post: (event) => (
    <div>
      <Linkify>{`@${event.createdUser.username}`}</Linkify> mentioned your {backlinkLink(event)} in
      the {postLink(event)}
      <Linkify>{`${event.group.username ? ` [in @${event.group.username}]` : ''}`}</Linkify>
    </div>
  ),
  banned_user: (event) => <Linkify>{`You blocked @${event.affectedUser.username}`}</Linkify>,
  unbanned_user: (event) => <Linkify>{`You unblocked @${event.affectedUser.username}`}</Linkify>,
  subscription_requested: (event) => (
    <div>
      <UserName user={event.createdUser}>@{event.createdUser.username}</UserName> sent you a
      subscription request <ReviewRequestLink from={event.createdUser} />
    </div>
  ),
  user_subscribed: (event) => (
    <Linkify>{`@${event.createdUser.username} subscribed to your feed`}</Linkify>
  ),
  user_unsubscribed: (event) => (
    <Linkify>{`@${event.createdUser.username} unsubscribed from your feed`}</Linkify>
  ),
  subscription_request_approved: (event) => (
    <Linkify>{`Your subscription request to @${event.createdUser.username} was approved`}</Linkify>
  ),
  subscription_request_rejected: (event) => (
    <Linkify>{`Your subscription request to @${event.createdUser.username} was rejected`}</Linkify>
  ),
  group_created: (event) => <Linkify>{`You created a group @${event.group.username}`}</Linkify>,
  group_subscription_requested: (event) => (
    <div>
      <UserName user={event.createdUser}>@{event.createdUser.username}</UserName> sent a request to
      join <UserName user={event.group}>@{event.group.username}</UserName> that you admin{' '}
      <ReviewRequestLink from={event.createdUser} group={event.group} />
    </div>
  ),
  group_admin_promoted: (event) => (
    <Linkify>{`@${event.createdUser.username} promoted @${event.affectedUser.username} to admin in the group @${event.group.username}`}</Linkify>
  ),
  group_admin_demoted: (event) => (
    <Linkify>{`@${event.createdUser.username} revoked admin privileges from @${event.affectedUser.username} in group @${event.group.username}`}</Linkify>
  ),
  managed_group_subscription_approved: (event) => (
    <Linkify>{`@${event.affectedUser.username} request to join @${event.group.username} was approved by @${event.createdUser.username}`}</Linkify>
  ),
  managed_group_subscription_rejected: (event) => (
    <Linkify>{`@${event.affectedUser.username} request to join @${event.group.username} was rejected`}</Linkify>
  ),
  group_subscription_approved: (event) => (
    <Linkify>{`Your request to join group @${event.group.username} was approved`}</Linkify>
  ),
  group_subscription_request_revoked: (event) => (
    <Linkify>{`@${event.createdUser.username} revoked subscription request to @${event.group.username}`}</Linkify>
  ),
  direct_left: (event) =>
    event.created_user_id === event.receiver.id ? (
      <div>
        You left a direct message created by <Linkify>{`@${event.postAuthor.username}`}</Linkify>
      </div>
    ) : event.post_author_id === event.receiver.id ? (
      <div>
        <Linkify>{`@${event.createdUser.username}`}</Linkify> left a {directPostLink(event)} created
        by you
      </div>
    ) : (
      <div>
        <Linkify>{`@${event.createdUser.username}`}</Linkify> left a {directPostLink(event)} created
        by <Linkify>{`@${event.postAuthor.username}`}</Linkify>
      </div>
    ),
  direct: (event) => (
    <div>
      {`You received a `}
      {directPostLink(event)}
      <Linkify>{` from @${event.createdUser.username}`}</Linkify>
    </div>
  ),
  direct_comment: (event) => (
    <div>
      {commentLink(event, 'New comment')}
      {` was posted to a `}
      {directPostLink(event)}
      <Linkify>{` from @${event.createdUser.username}`}</Linkify>
    </div>
  ),
  group_subscription_rejected: (event) => (
    <Linkify>{`Your request to join group @${event.group.username} was rejected`}</Linkify>
  ),
  group_subscribed: (event) => (
    <Linkify>{`@${event.createdUser.username} subscribed to @${event.group.username}`}</Linkify>
  ),
  group_unsubscribed: (event) => (
    <Linkify>{`@${event.createdUser.username} unsubscribed from @${event.group.username}`}</Linkify>
  ),
  invitation_used: (event) => (
    <Linkify>{`@${event.createdUser.username} has joined ${CONFIG.siteTitle} using your invitation`}</Linkify>
  ),

  banned_by_user: () => `Notification shouldn't be shown`,
  unbanned_by_user: () => `Notification shouldn't be shown`,

  comment_moderated: (event) => (
    <div>
      <Linkify>{`@${event.createdUser.username} has deleted your comment to the `}</Linkify>
      {postLink(event)}
      {event.group_id ? <Linkify>{` in the group @${event.group.username}`}</Linkify> : null}
    </div>
  ),
  comment_moderated_by_another_admin: (event) => (
    <div>
      <Linkify>{`@${event.createdUser.username} has removed a comment from @${event.affectedUser.username} to the `}</Linkify>
      {postLink(event)}
      <Linkify>{` in the group @${event.group.username}`}</Linkify>
    </div>
  ),
  post_moderated: (event) => (
    <div>
      <Linkify>{`@${event.createdUser.username} has removed your `}</Linkify>
      {event.post_id ? postLink(event) : 'post'}
      {event.group_id ? <Linkify>{` from the group @${event.group.username}`}</Linkify> : null}
    </div>
  ),
  post_moderated_by_another_admin: (event) => (
    <div>
      <Linkify>{`@${event.createdUser.username} has removed the `}</Linkify>
      {event.post_id ? postLink(event) : 'post'}
      <Linkify>{` from @${event.affectedUser.username} `}</Linkify>
      {event.group_id ? <Linkify>{` from the group @${event.group.username}`}</Linkify> : null}
    </div>
  ),

  blocked_in_group: (event) => {
    let adminHTML = 'Admin';

    if (event.created_user_id) {
      adminHTML =
        event.recipient_user_id === event.created_user_id ? 'You' : `@${event.creator.username}`;
    }

    const victimHTML =
      event.recipient_user_id === event.affected_user_id
        ? 'you'
        : `@${event.affectedUser.username}`;
    const groupLink = `@${event.group.username}`;

    const action = event.event_type === 'blocked_in_group' ? 'blocked' : 'unblocked';

    return (
      <div>
        <Linkify>
          {adminHTML} {action} {victimHTML} in group {groupLink}
        </Linkify>
      </div>
    );
  },

  bans_in_group_disabled: (event) => {
    const isSelf = event.recipient_user_id === event.created_user_id;
    const html = `${isSelf ? 'You' : `@${event.creator.username}`} disabled bans ${
      isSelf ? 'for yourself' : 'for you'
    } in group @${event.group.username}`;
    return (
      <div>
        <Linkify>{html}</Linkify>
      </div>
    );
  },

  bans_in_group_enabled: (event) => {
    const isSelf = event.recipient_user_id === event.created_user_id;
    const html = `${isSelf ? 'You' : `@${event.creator.username}`} enabled bans ${
      isSelf ? 'for yourself' : 'for you'
    } in group @${event.group.username}`;
    return (
      <div>
        <Linkify>{html}</Linkify>
      </div>
    );
  },
};

notificationTemplates.unblocked_in_group = notificationTemplates.blocked_in_group;

const notificationClasses = {
  mention_in_post: 'mention',
  mention_in_comment: 'mention',
  mention_comment_to: 'mention',
  banned_user: 'ban',
  unbanned_user: 'ban',
  invitation_used: 'subscription',
  subscription_requested: 'subscription',
  subscription_request_revoked: 'subscription',
  user_subscribed: 'subscription',
  user_unsubscribed: 'subscription',
  subscription_request_approved: 'subscription',
  subscription_request_rejected: 'subscription',
  group_created: 'group',
  group_subscription_requested: 'group',
  group_admin_promoted: 'group',
  group_admin_demoted: 'group',
  group_subscription_approved: 'group',
  group_subscription_request_revoked: 'group',
  group_subscription_rejected: 'group',
  group_subscribed: 'group',
  group_unsubscribed: 'group',
  managed_group_subscription_approved: 'group',
  managed_group_subscription_rejected: 'group',
  direct: 'direct',
  direct_comment: 'direct',
  banned_by_user: 'ban',
  unbanned_by_user: 'ban',
  comment_moderated: 'group',
  comment_moderated_by_another_admin: 'group',
  post_moderated: 'group',
  post_moderated_by_another_admin: 'group',
};

const nop = () => false;

const Notification = (props) => {
  return (
    <div
      key={props.id}
      className={`single-notification ${notificationClasses[props.event_type] || ''}`}
    >
      {(notificationTemplates[props.event_type] || nop)(props)}
      <TimeDisplay timeStamp={props.date} />
    </div>
  );
};

const isFilterActive = (filterName, filter) => filter && filter.includes(filterName);

const Notifications = (props) => (
  <div className="box notifications">
    <ErrorBoundary>
      <div className="box-header-timeline" role="heading">
        Notifications
        {props.isLoading && (
          <span className="notifications-throbber">
            <Throbber />
          </span>
        )}
      </div>
      <div className="filter">
        <div>Show: </div>
        <Link
          className={!props.location.query.filter ? 'active' : ''}
          to={{ pathname: props.location.pathname, query: {} }}
        >
          Everything
        </Link>
        <Link
          className={isFilterActive('mentions', props.location.query.filter) ? 'active' : ''}
          to={{ pathname: props.location.pathname, query: { filter: 'mentions' } }}
        >
          Mentions
        </Link>
        <Link
          className={isFilterActive('subscriptions', props.location.query.filter) ? 'active' : ''}
          to={{ pathname: props.location.pathname, query: { filter: 'subscriptions' } }}
        >
          Subscriptions
        </Link>
        <Link
          className={isFilterActive('groups', props.location.query.filter) ? 'active' : ''}
          to={{ pathname: props.location.pathname, query: { filter: 'groups' } }}
        >
          Groups
        </Link>
        <Link
          className={isFilterActive('directs', props.location.query.filter) ? 'active' : ''}
          to={{ pathname: props.location.pathname, query: { filter: 'directs' } }}
        >
          Direct messages
        </Link>
        <Link
          className={isFilterActive('bans', props.location.query.filter) ? 'active' : ''}
          to={{ pathname: props.location.pathname, query: { filter: 'bans' } }}
        >
          Bans
        </Link>
      </div>
      {props.authenticated ? (
        <PaginatedView routes={props.routes} location={props.location}>
          <div className="notification-list">
            {props.loading
              ? 'Loading'
              : props.events.length > 0
              ? props.events.map(Notification)
              : 'No notifications yet'}
          </div>
        </PaginatedView>
      ) : (
        <div className="alert alert-danger" role="alert">
          You must <SignInLink>sign in</SignInLink> or <Link to="/signup">sign up</Link> before
          visiting this page.
        </div>
      )}
    </ErrorBoundary>
  </div>
);

const mock = {};

const mapStateToProps = (state) => {
  return {
    isLoading: state.notifications.loading,
    filter: state.routing.locationBeforeTransitions.query.filter,
    authenticated: state.authenticated,
    events: (state.notifications.events || []).map((event) => {
      return {
        ...event,
        createdUser:
          state.users[event.created_user_id] || state.subscribers[event.created_user_id] || mock,
        affectedUser:
          state.users[event.affected_user_id] || state.subscribers[event.affected_user_id] || mock,
        group: state.users[event.group_id] || mock,
        postAuthor: state.users[event.post_author_id],
        post: state.posts[event.post_id] || mock,
        comment: state.comments[event.comment_id] || mock,
        receiver: state.user,
      };
    }),
  };
};

export default connect(mapStateToProps)(Notifications);

function ReviewRequestLink({ from, group = null }) {
  const managedGroups = useSelector((state) => state.managedGroups);
  const requests = useSelector((state) => state.userRequests);

  const hasRequest = useMemo(() => {
    if (group) {
      const g = managedGroups.find((g) => g.id === group.id);
      return g && g.requests.some((u) => u.id === from.id);
    }
    return requests.some((u) => u.id === from.id);
  }, [requests, managedGroups, group, from]);

  if (!hasRequest) {
    return null;
  }

  return (
    <>
      <Link to="/friends?show=requests" className="btn btn-default btn-sm">
        Review
      </Link>
    </>
  );
}
