export interface FormEditingFiltersProps {
    onApply: Function;
    setFilterName: Function;
    workspaceId: string;
    userId: string;
    filterId: string;
    filterName: string;
    values: any;
    onCancel: Function;
}