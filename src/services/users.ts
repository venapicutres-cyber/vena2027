import supabase from '../lib/supabaseClient';
import { User, ViewType } from '../types';

const TABLE = 'users';

function fromRow(row: any): User {
  return {
    id: row.id,
    email: row.email,
    password: '',
    fullName: row.full_name,
    companyName: row.company_name || undefined,
    role: row.role || 'Member',
    permissions: row.permissions || [],
  };
}

export async function listUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id,email,full_name,company_name,role,permissions,restricted_cards');
  if (error) throw error;
  return (data || []).map(fromRow);
}

async function invokeAdminUsers(body: Record<string, unknown>): Promise<any> {
  const { data, error } = await supabase.functions.invoke('admin-users', { body });
  if (error) throw new Error(error.message || 'Gagal memproses pengguna.');
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function createUser(input: Omit<User, 'id'>): Promise<User> {
  const data = await invokeAdminUsers({ action: 'create', ...input });
  if (!data?.user) throw new Error('Server tidak mengembalikan data pengguna.');
  return data.user as User;
}

export async function updateUser(userId: string, input: Partial<Omit<User, 'id'>>): Promise<User> {
  const data = await invokeAdminUsers({ action: 'update', targetUserId: userId, ...input });
  if (!data?.user) throw new Error('Server tidak mengembalikan data pengguna.');
  return data.user as User;
}

export async function deleteUser(userId: string): Promise<void> {
  await invokeAdminUsers({ action: 'delete', targetUserId: userId });
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id,email,full_name,company_name,role,permissions,restricted_cards')
    .eq('email', email)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data ? fromRow(data) : null;
}
