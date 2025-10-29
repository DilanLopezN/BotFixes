import { RouteChild } from '../interfaces';

export interface RouteWrapperProps {
  route: RouteChild;
  isParentAuthenticated?: boolean;
}
