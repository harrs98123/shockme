'use client';

import React from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading' | 'default';

export interface ToastAction {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  primary?: boolean;
}

export interface ToastOptions {
  id?: string;
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number; // in ms, default 3500
  icon?: React.ReactNode;
  action?: ToastAction;
  cancel?: {
    label: string;
    onClick?: () => void;
  };
  onDismiss?: () => void;
}

export interface ToastItem extends ToastOptions {
  id: string;
  createdAt: number;
}

type ToastSubscriber = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private subscribers: Set<ToastSubscriber> = new Set();
  private count = 0;

  subscribe(subscriber: ToastSubscriber) {
    this.subscribers.add(subscriber);
    subscriber(this.toasts);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  private notify() {
    this.subscribers.forEach((sub) => sub([...this.toasts]));
  }

  show(messageOrOptions: string | ToastOptions, options?: ToastOptions): string {
    const id = (typeof messageOrOptions === 'object' && messageOrOptions.id) 
      || options?.id 
      || `toast-${++this.count}-${Date.now()}`;

    let item: ToastItem;

    if (typeof messageOrOptions === 'string') {
      item = {
        id,
        title: messageOrOptions,
        type: options?.type || 'default',
        duration: options?.duration ?? 3500,
        createdAt: Date.now(),
        ...options,
      };
    } else {
      item = {
        id,
        type: messageOrOptions.type || 'default',
        duration: messageOrOptions.duration ?? 3500,
        createdAt: Date.now(),
        ...messageOrOptions,
      };
    }

    // Replace if already exists with same id, else prepend
    const existingIndex = this.toasts.findIndex((t) => t.id === id);
    if (existingIndex > -1) {
      this.toasts[existingIndex] = item;
    } else {
      // Keep up to 6 toasts at a time
      this.toasts = [item, ...this.toasts.slice(0, 5)];
    }

    this.notify();
    return id;
  }

  success(title: string, descriptionOrOptions?: string | Omit<ToastOptions, 'type'>, options?: Omit<ToastOptions, 'type'>): string {
    if (typeof descriptionOrOptions === 'string') {
      return this.show(title, { ...options, description: descriptionOrOptions, type: 'success' });
    }
    return this.show(title, { ...descriptionOrOptions, type: 'success' });
  }

  error(title: string, descriptionOrOptions?: string | Omit<ToastOptions, 'type'>, options?: Omit<ToastOptions, 'type'>): string {
    if (typeof descriptionOrOptions === 'string') {
      return this.show(title, { ...options, description: descriptionOrOptions, type: 'error' });
    }
    return this.show(title, { ...descriptionOrOptions, type: 'error' });
  }

  info(title: string, descriptionOrOptions?: string | Omit<ToastOptions, 'type'>, options?: Omit<ToastOptions, 'type'>): string {
    if (typeof descriptionOrOptions === 'string') {
      return this.show(title, { ...options, description: descriptionOrOptions, type: 'info' });
    }
    return this.show(title, { ...descriptionOrOptions, type: 'info' });
  }

  warning(title: string, descriptionOrOptions?: string | Omit<ToastOptions, 'type'>, options?: Omit<ToastOptions, 'type'>): string {
    if (typeof descriptionOrOptions === 'string') {
      return this.show(title, { ...options, description: descriptionOrOptions, type: 'warning' });
    }
    return this.show(title, { ...descriptionOrOptions, type: 'warning' });
  }

  loading(title: string, descriptionOrOptions?: string | Omit<ToastOptions, 'type'>, options?: Omit<ToastOptions, 'type'>): string {
    const duration = typeof descriptionOrOptions === 'object' ? (descriptionOrOptions?.duration ?? 10000) : (options?.duration ?? 10000);
    if (typeof descriptionOrOptions === 'string') {
      return this.show(title, { ...options, description: descriptionOrOptions, type: 'loading', duration });
    }
    return this.show(title, { ...descriptionOrOptions, type: 'loading', duration });
  }

  async promise<T>(
    promise: Promise<T>,
    msgs: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    },
    options?: Omit<ToastOptions, 'type'>
  ): Promise<T> {
    const id = this.loading(msgs.loading, options);
    try {
      const data = await promise;
      const title = typeof msgs.success === 'function' ? msgs.success(data) : msgs.success;
      this.show(title, { ...options, id, type: 'success', duration: 3500 });
      return data;
    } catch (err) {
      const title = typeof msgs.error === 'function' ? msgs.error(err) : msgs.error;
      this.show(title, { ...options, id, type: 'error', duration: 4000 });
      throw err;
    }
  }

  dismiss(id?: string) {
    if (id) {
      const item = this.toasts.find((t) => t.id === id);
      if (item?.onDismiss) item.onDismiss();
      this.toasts = this.toasts.filter((t) => t.id !== id);
    } else {
      this.toasts.forEach((t) => t.onDismiss?.());
      this.toasts = [];
    }
    this.notify();
  }
}

export const toastManager = new ToastManager();

export const toast = (messageOrOptions: string | ToastOptions, options?: ToastOptions) =>
  toastManager.show(messageOrOptions, options);

toast.success = (title: string, descriptionOrOptions?: string | Omit<ToastOptions, 'type'>, options?: Omit<ToastOptions, 'type'>) =>
  toastManager.success(title, descriptionOrOptions, options);

toast.error = (title: string, descriptionOrOptions?: string | Omit<ToastOptions, 'type'>, options?: Omit<ToastOptions, 'type'>) =>
  toastManager.error(title, descriptionOrOptions, options);

toast.info = (title: string, descriptionOrOptions?: string | Omit<ToastOptions, 'type'>, options?: Omit<ToastOptions, 'type'>) =>
  toastManager.info(title, descriptionOrOptions, options);

toast.warning = (title: string, descriptionOrOptions?: string | Omit<ToastOptions, 'type'>, options?: Omit<ToastOptions, 'type'>) =>
  toastManager.warning(title, descriptionOrOptions, options);

toast.loading = (title: string, descriptionOrOptions?: string | Omit<ToastOptions, 'type'>, options?: Omit<ToastOptions, 'type'>) =>
  toastManager.loading(title, descriptionOrOptions, options);

toast.promise = <T,>(
  promise: Promise<T>,
  msgs: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((err: any) => string);
  },
  options?: Omit<ToastOptions, 'type'>
) => toastManager.promise(promise, msgs, options);

toast.dismiss = (id?: string) => toastManager.dismiss(id);

export default toast;
