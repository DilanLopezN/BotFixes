export interface RunnerInterface {
    id: number;
    name: string;
    workspaceId: string;
    createdAt: Date;
}

export interface CreateRunner extends Omit<RunnerInterface, 'id' | 'createdAt'> {}

export interface UpdateRunner extends RunnerInterface {}
