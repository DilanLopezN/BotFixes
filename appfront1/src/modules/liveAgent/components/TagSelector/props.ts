import { User } from "kissbot-core";
import React from "react";

export interface TagSelectorProps {
  conversation: any;
  workspaceId: string;
  onTagsChanged: Function;
  place?: string;
  loggedUser: User;
  children?: React.ReactNode;
}

export interface Tag {
  _id: string;
  name: string;
  color: string;
  inactive: boolean;
  workspaceId: string;
}
