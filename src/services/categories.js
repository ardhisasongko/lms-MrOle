import { supabase } from './supabase';

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, icon, display_order')
    .order('display_order');
  if (error) throw error;
  return data || [];
}

export async function getCategorySummary() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .order('display_order');
  if (error) throw error;
  return data || [];
}

export async function createCategory(form) {
  const { data, error } = await supabase
    .from('categories')
    .insert(form)
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id, form) {
  const { error } = await supabase
    .from('categories')
    .update(form)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteCategory(id) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
