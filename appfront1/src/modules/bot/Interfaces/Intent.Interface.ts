export interface IntentsInterface {
    name: string;
    canDuplicateContext?: boolean;
    label: string;
    attributes: { name: string; label: string; value: any }[];
}
