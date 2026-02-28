'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ReviewComment } from '../types';

interface ReviewState {
  // PR info
  prNumber: number | null;
  prUrl: string | null;
  prTitle: string | null;
  branch: string | null;
  isOnReviewBranch: boolean;

  // Comments
  reviewComments: ReviewComment[];

  // Loading states
  isSubmitting: boolean;
  isPullingComments: boolean;
  isPushingUpdate: boolean;

  // Status/errors
  status: 'idle' | 'submitting' | 'pulling' | 'pushing' | 'done' | 'error';
  statusMessage: string | null;
  error: string | null;
}

export function useReview(filePath: string) {
  const [state, setState] = useState<ReviewState>({
    prNumber: null,
    prUrl: null,
    prTitle: null,
    branch: null,
    isOnReviewBranch: false,
    reviewComments: [],
    isSubmitting: false,
    isPullingComments: false,
    isPushingUpdate: false,
    status: 'idle',
    statusMessage: null,
    error: null,
  });

  // Check PR status on mount and when filePath changes
  const checkPrStatus = useCallback(async () => {
    const api = window.electronAPI;
    if (!api?.git?.prStatus) return;
    try {
      const result = await api.git.prStatus(filePath);
      if (result.success && result.pr) {
        setState(prev => ({
          ...prev,
          prNumber: result.pr!.number,
          prUrl: result.pr!.url,
          prTitle: result.pr!.title,
          branch: result.branch || null,
          isOnReviewBranch: (result.branch || '').startsWith('review/'),
        }));
      } else {
        setState(prev => ({
          ...prev,
          prNumber: null,
          prUrl: null,
          prTitle: null,
          branch: result.branch || null,
          isOnReviewBranch: (result.branch || '').startsWith('review/'),
        }));
      }
    } catch { /* ignore */ }
  }, [filePath]);

  // Reset all state and re-check when file changes
  useEffect(() => {
    setState({
      prNumber: null,
      prUrl: null,
      prTitle: null,
      branch: null,
      isOnReviewBranch: false,
      reviewComments: [],
      isSubmitting: false,
      isPullingComments: false,
      isPushingUpdate: false,
      status: 'idle',
      statusMessage: null,
      error: null,
    });
    checkPrStatus();
  }, [filePath]);

  // Submit for review — creates branch + PR
  const submitForReview = useCallback(async (title?: string) => {
    const api = window.electronAPI;
    if (!api?.git?.createReview) return;

    setState(prev => ({ ...prev, isSubmitting: true, status: 'submitting', error: null, statusMessage: 'Creating review...' }));
    try {
      const result = await api.git.createReview(filePath, title);
      if (result.success) {
        setState(prev => ({
          ...prev,
          isSubmitting: false,
          prNumber: result.prNumber || null,
          prUrl: result.prUrl || null,
          branch: result.branchName || null,
          isOnReviewBranch: true,
          status: 'done',
          statusMessage: 'Review submitted!',
        }));
      } else {
        setState(prev => ({
          ...prev,
          isSubmitting: false,
          status: 'error',
          error: result.error || 'Failed to create review',
          statusMessage: null,
        }));
      }
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        status: 'error',
        error: err.message || 'Failed to create review',
        statusMessage: null,
      }));
    }
  }, [filePath]);

  // Pull review comments from GitHub PR
  const pullComments = useCallback(async () => {
    const api = window.electronAPI;
    if (!api?.git?.prComments) return;

    // Re-check PR status first (PR may have been closed on GitHub)
    let prNum = state.prNumber;
    try {
      const status = await api.git.prStatus(filePath);
      if (status.success && status.pr) {
        prNum = status.pr.number;
        setState(prev => ({ ...prev, prNumber: status.pr!.number, prUrl: status.pr!.url, prTitle: status.pr!.title }));
      } else {
        setState(prev => ({ ...prev, prNumber: null, prUrl: null, prTitle: null, status: 'error', error: 'No open PR found', statusMessage: null }));
        return;
      }
    } catch { /* use cached prNumber */ }

    if (!prNum) return;

    setState(prev => ({ ...prev, isPullingComments: true, status: 'pulling', statusMessage: 'Pulling reviews...' }));
    try {
      const result = await api.git.prComments(filePath, prNum);
      if (result.success) {
        setState(prev => ({
          ...prev,
          isPullingComments: false,
          reviewComments: (result.comments || []) as ReviewComment[],
          status: 'done',
          statusMessage: `${(result.comments || []).length} comment${(result.comments || []).length !== 1 ? 's' : ''} pulled`,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isPullingComments: false,
          status: 'error',
          error: result.error || 'Failed to pull comments',
          statusMessage: null,
        }));
      }
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isPullingComments: false,
        status: 'error',
        error: err.message || 'Failed to pull comments',
        statusMessage: null,
      }));
    }
  }, [filePath, state.prNumber]);

  // Push update to review branch
  const pushUpdate = useCallback(async () => {
    const api = window.electronAPI;
    if (!api?.git?.pushReviewUpdate) return;

    // Re-check PR status first
    try {
      const status = await api.git.prStatus(filePath);
      if (!status.success || !status.pr) {
        setState(prev => ({ ...prev, prNumber: null, prUrl: null, prTitle: null, status: 'error', error: 'No open PR found. Submit for review first.', statusMessage: null }));
        return;
      }
    } catch { /* proceed anyway */ }

    setState(prev => ({ ...prev, isPushingUpdate: true, status: 'pushing', statusMessage: 'Pushing update...' }));
    try {
      const result = await api.git.pushReviewUpdate(filePath);
      if (result.success) {
        // Refresh PR status after push
        checkPrStatus();
        setState(prev => ({
          ...prev,
          isPushingUpdate: false,
          status: 'done',
          statusMessage: 'Update pushed!',
        }));
      } else {
        setState(prev => ({
          ...prev,
          isPushingUpdate: false,
          status: 'error',
          error: result.error || 'Failed to push update',
          statusMessage: null,
        }));
      }
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isPushingUpdate: false,
        status: 'error',
        error: err.message || 'Failed to push update',
        statusMessage: null,
      }));
    }
  }, [filePath, checkPrStatus]);

  // Dismiss status
  const dismissStatus = useCallback(() => {
    setState(prev => ({ ...prev, status: 'idle', statusMessage: null, error: null }));
  }, []);

  return {
    ...state,
    submitForReview,
    pullComments,
    pushUpdate,
    checkPrStatus,
    dismissStatus,
  };
}
