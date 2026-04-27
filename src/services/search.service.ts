import { SavedSearch, SearchFilters } from '@/types';
import { supabase } from '@/lib/supabase';

export const searchService = {
  async fetchSavedSearches(userId: string): Promise<SavedSearch[]> {
    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(s => ({
        id: s.id,
        userId: s.user_id,
        name: s.name,
        filters: s.filters as SearchFilters,
        createdAt: s.created_at
      }));
    } catch (error) {
      console.error('Error fetching saved searches:', error);
      return [];
    }
  },

  async saveSearch(userId: string, name: string, filters: SearchFilters): Promise<SavedSearch> {
    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .insert([{
          user_id: userId,
          name,
          filters
        }])
        .select();

      if (error) throw error;
      
      const s = data[0];
      return {
        id: s.id,
        userId: s.user_id,
        name: s.name,
        filters: s.filters as SearchFilters,
        createdAt: s.created_at
      };
    } catch (error) {
      console.error('Error saving search:', error);
      throw error;
    }
  },

  async deleteSavedSearch(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting saved search:', error);
      throw error;
    }
  }
};
