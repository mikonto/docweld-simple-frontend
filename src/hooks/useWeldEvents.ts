import { useMemo } from 'react';
import {
  where,
  orderBy,
  limit,
  writeBatch,
  doc,
  collection,
  serverTimestamp,
  type QueryConstraint,
  type FirestoreError,
} from 'firebase/firestore';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { useFirestoreOperations } from '@/hooks/firebase/useFirestoreOperations';
import { useApp } from '@/contexts/AppContext';
import { db } from '@/config/firebase';
import { STATUS } from '@/types/common/status';
import type { CreateWeldEventInput, WeldEvent } from '@/types/models/welding';

interface WeldEventsHookResult {
  events: WeldEvent[];
  loading: boolean;
  error: FirestoreError | undefined;
}

interface BatchWeldEventInput {
  weldId: string;
  weldLogId: string;
  projectId: string;
}

export const useWeldEvents = (weldId: string | null): WeldEventsHookResult => {
  const constraints = useMemo<QueryConstraint[]>(() => {
    if (!weldId) {
      return [];
    }

    return [
      where('weldId', '==', weldId),
      orderBy('performedAt', 'desc'),
      limit(100),
    ];
  }, [weldId]);

  const { documents, loading, error } = useFirestoreOperations('weld-events', {
    constraints,
    disabled: !weldId,
  });

  if (!weldId) {
    return {
      events: [],
      loading: false,
      error: undefined,
    };
  }

  return {
    events: documents as WeldEvent[],
    loading,
    error,
  };
};

export const useWeldEventOperations = () => {
  const { loggedInUser } = useApp();
  const { t } = useTranslation();
  const { create } = useFirestoreOperations('weld-events', {
    disabled: true,
  });

  const createEvent = async (input: CreateWeldEventInput): Promise<string> => {
    if (!loggedInUser) {
      throw new Error('User must be logged in to create events');
    }

    return create(input, { suppressToast: false });
  };

  const createBatchEvents = async (
    weldData: BatchWeldEventInput[],
    eventDetails: Omit<CreateWeldEventInput, 'weldId' | 'weldLogId' | 'projectId'>
  ): Promise<void> => {
    if (!loggedInUser) {
      throw new Error('User must be logged in to create events');
    }

    if (weldData.length === 0) {
      return;
    }

    try {
      const batch = writeBatch(db);
      const timestamp = serverTimestamp();

      weldData.forEach(({ weldId, weldLogId, projectId }) => {
        const ref = doc(collection(db, 'weld-events'));
        batch.set(ref, {
          ...eventDetails,
          weldId,
          weldLogId,
          projectId,
          id: ref.id,
          status: STATUS.ACTIVE,
          createdAt: timestamp,
          createdBy: loggedInUser.uid,
          updatedAt: timestamp,
          updatedBy: loggedInUser.uid,
        });
      });

      await batch.commit();
      toast.success(t('weldEvents.batchCreateSuccess', { count: weldData.length }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('weldEvents.batchCreateError');
      toast.error(message || t('weldEvents.batchCreateError'));
      throw error;
    }
  };

  return { createEvent, createBatchEvents };
};
