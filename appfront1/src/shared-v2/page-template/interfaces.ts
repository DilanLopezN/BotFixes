import React from 'react';

export interface PageTemplateProps {
    title?: string | React.ReactNode;
    actionButtons?: React.ReactNode | React.ReactNode[];
    children?: React.ReactNode;
}
export interface HeaderProps {
    hasActions?: boolean;
}
