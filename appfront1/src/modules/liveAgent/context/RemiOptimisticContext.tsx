import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAllRemiSettings } from '../hooks/use-all-remi-settings';

export interface RemiState {
    smtReId?: string | null;
    stoppedSmtReId?: string | null;
    isWithSmtRe: boolean;
    remiName?: string;
}

export interface OptimisticRemiUpdates {
    smtReId?: string | null | undefined;
    stoppedSmtReId?: string | null | undefined;
    isWithSmtRe?: boolean;
}

interface RemiOptimisticContextType {
    getOptimisticState: (conversationId: string, conversation: { smtReId?: string | null }) => RemiState;
    setOptimisticStatus: (conversationId: string, updates: OptimisticRemiUpdates | undefined) => void;
    allRemiRules: ReturnType<typeof useAllRemiSettings>['data'];
}

const RemiOptimisticContext = createContext<RemiOptimisticContextType>({
    getOptimisticState: () => ({ isWithSmtRe: false, remiName: undefined, stoppedSmtReId: null }),
    setOptimisticStatus: () => {},
    allRemiRules: [],
});

export const RemiOptimisticProvider = ({ children }: { children: ReactNode }) => {
    const workspaceId = useSelector((state: any) => state.workspaceReducer.selectedWorkspace?._id);

    const { data: allRemiRules } = useAllRemiSettings(workspaceId);

    const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, OptimisticRemiUpdates | undefined>>({});

    const setOptimisticStatus = useCallback((conversationId: string, updates: OptimisticRemiUpdates | undefined) => {
        setOptimisticStatuses((prev) => {
            if (updates === undefined) {
                const newUpdates = { ...prev };
                delete newUpdates[conversationId];
                return newUpdates;
            }

            return {
                ...prev,
                [conversationId]: {
                    ...(prev[conversationId] || {}),
                    ...updates,
                },
            };
        });
    }, []);

    const getOptimisticState = useCallback(
        (
            conversationId: string,
            conversation: { smtReId?: string | null; stoppedSmtReId?: string | null }
        ): RemiState => {
            const optimisticStatus = optimisticStatuses[conversationId];

            const smtReId = optimisticStatus?.smtReId ?? conversation.smtReId;
            const isWithSmtRe = optimisticStatus?.isWithSmtRe ?? false;
            const stoppedSmtReId = optimisticStatus?.stoppedSmtReId ?? conversation?.stoppedSmtReId;
            const remiName =
                typeof smtReId === 'string' ? allRemiRules?.find((r) => r.id === smtReId)?.name : undefined;
            return {
                smtReId,
                isWithSmtRe,
                remiName,
                stoppedSmtReId,
            };
        },
        [optimisticStatuses, allRemiRules]
    );
    const value: RemiOptimisticContextType = useMemo(
        () => ({
            getOptimisticState,
            setOptimisticStatus,
            allRemiRules,
        }),
        [getOptimisticState, setOptimisticStatus, allRemiRules]
    );

    return <RemiOptimisticContext.Provider value={value}>{children}</RemiOptimisticContext.Provider>;
};

export const useRemiOptimistic = () => {
    const context = useContext(RemiOptimisticContext);
    return context;
};
