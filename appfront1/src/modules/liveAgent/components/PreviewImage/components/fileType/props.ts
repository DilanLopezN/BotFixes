import { ImageTypeSelected } from "../modalIntegration";

export interface FileTypeProps {
    imageTypeSelected: number;
    onChange: (type: ImageTypeSelected) => void;
    addNotification: (args: any) => void;
    workspaceId: string;
 }
