export interface BotDesignerRoute{
    path: string;
    isAuth: Boolean | boolean;
    component?: any;
    exact?: boolean;
    redirectTo?: string;
    canAccess?: boolean;
    title?: string;
}
