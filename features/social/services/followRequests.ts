import {
  cancelFollowRequest,
  hasPendingRequest,
  listenPendingRequests,
  sendFollowRequest,
} from './followRequests/outgoing';
import { approveAllPending, approveRequest, rejectRequest } from './followRequests/review';

export const followRequestActions = {
  approveAllPending,
  approveRequest,
  cancelFollowRequest,
  hasPendingRequest,
  listenPendingRequests,
  rejectRequest,
  sendFollowRequest,
};
