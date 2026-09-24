import { getSupabaseClient } from '../supabase/client';
import { NotificationItem, NotificationType } from '../../types/database';

export async function fetchNotifications(userId: string): Promise<NotificationItem[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return (data || []) as NotificationItem[];
}

export async function createNotification(
  _userId: string | undefined | null,
  notification: {
    title: string;
    message: string;
    type?: NotificationType | string;
  }
): Promise<NotificationItem | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return null;

  const { data, error } = await supabase
    .from('notifications')
    .insert([
      {
        user_id: authData.user.id,
        title: notification.title.trim(),
        message: notification.message.trim(),
        type: notification.type || 'System',
        read: false,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }

  return data as NotificationItem;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return;

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .eq('user_id', authData.user.id);

  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { data: authData } = await supabase.auth.getUser();
  const effectiveUserId = authData?.user?.id || userId;
  if (!effectiveUserId) return;

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', effectiveUserId)
    .eq('read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

export async function deleteNotification(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return;

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', authData.user.id);

  if (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}
