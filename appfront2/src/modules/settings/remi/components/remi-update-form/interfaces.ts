export interface RemiUpdateFormProps {
  teamOptions: { value: string | undefined; label: string }[] | undefined;
  isLoadingChannelConfigList: boolean;
  onSavingChange: (isLoading: boolean) => void;
  onRemiCreated: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}
