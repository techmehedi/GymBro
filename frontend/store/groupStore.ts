import { create } from 'zustand';
import { apiClient } from '../lib/supabase';
import type { Group, GroupState, CreateGroupRequest } from '../types';

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  currentGroup: null,
  isLoading: false,

  createGroup: async (data: CreateGroupRequest) => {
    set({ isLoading: true });
    try {
      const { group } = await apiClient.createGroup(data);
      set(state => ({
        groups: [group, ...state.groups],
        isLoading: false
      }));
      return { group };
    } catch (error) {
      console.error('Create group error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  joinGroup: async (inviteCode: string) => {
    set({ isLoading: true });
    try {
      const { group } = await apiClient.joinGroup(inviteCode);
      set(state => ({
        groups: [group, ...state.groups],
        isLoading: false
      }));
    } catch (error) {
      console.error('Join group error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  leaveGroup: async (groupId: string) => {
    set({ isLoading: true });
    try {
      await apiClient.leaveGroup(groupId);
      set(state => ({
        groups: state.groups.filter(g => g.id !== groupId),
        currentGroup: state.currentGroup?.id === groupId ? null : state.currentGroup,
        isLoading: false
      }));
    } catch (error) {
      console.error('Leave group error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  deleteGroup: async (groupId: string) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.deleteGroup(groupId);
      console.log('Delete group response:', response);
      set(state => ({
        groups: state.groups.filter(g => g.id !== groupId),
        currentGroup: state.currentGroup?.id === groupId ? null : state.currentGroup,
        isLoading: false
      }));
    } catch (error) {
      console.error('Delete group error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  fetchGroups: async () => {
    set({ isLoading: true });
    try {
      const { groups } = await apiClient.getGroups();
      set({ groups, isLoading: false });
    } catch (error) {
      console.error('Fetch groups error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  setCurrentGroup: (group: Group | null) => {
    set({ currentGroup: group });
  },
}));
