import { useState, useCallback, useSyncExternalStore } from "react";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  icon: "confirmed" | "assigned" | "onway" | "arrived" | "photo" | "info";
  timestamp: number;
  read: boolean;
}

type Listener = () => void;

let notifications: AppNotification[] = [];
let listeners: Set<Listener> = new Set();

const emit = () => listeners.forEach((l) => l());

export const pushNotification = (n: Omit<AppNotification, "id" | "timestamp" | "read">) => {
  notifications = [
    { ...n, id: crypto.randomUUID(), timestamp: Date.now(), read: false },
    ...notifications,
  ];
  emit();
};

export const markAllRead = () => {
  notifications = notifications.map((n) => ({ ...n, read: true }));
  emit();
};

export const markRead = (id: string) => {
  notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  emit();
};

export const clearNotifications = () => {
  notifications = [];
  emit();
};

const getSnapshot = () => notifications;
const subscribe = (cb: Listener) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const useNotifications = () => {
  const notifs = useSyncExternalStore(subscribe, getSnapshot);
  const unreadCount = notifs.filter((n) => !n.read).length;
  return { notifications: notifs, unreadCount };
};
