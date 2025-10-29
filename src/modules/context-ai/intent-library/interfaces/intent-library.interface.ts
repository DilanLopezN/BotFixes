export interface IIntentLibrary {
    id: string;
    name: string;
    description: string;
    examples: string[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

export interface CreateIntentLibraryData {
    name: string;
    description: string;
    examples: string[];
}

export interface UpdateIntentLibraryData {
    intentLibraryId: string;
    name?: string;
    description?: string;
    examples?: string[];
}

export interface DeleteIntentLibraryData {
    intentLibraryId: string;
}

export interface ListIntentLibraryFilter {
    search?: string;
}
