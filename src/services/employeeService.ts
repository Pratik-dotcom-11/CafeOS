import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

export type RestaurantRole = Database['public']['Enums']['restaurant_role'];
export type MemberStatus = Database['public']['Enums']['member_status'];

export interface StaffMember {
  id: string; // restaurant_members.id
  userId: string;
  restaurantId: string;
  role: RestaurantRole;
  status: MemberStatus;
  fullName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffAuditLog {
  id: string;
  action: string;
  resourceId: string | null;
  details: any;
  userId: string | null;
  createdAt: string;
}

export const employeeService = {
  /**
   * Fetch all staff members for a restaurant, joined with profiles.
   */
  async getEmployees(restaurantId: string): Promise<StaffMember[]> {
    const { data, error } = await supabase
      .from('restaurant_members')
      .select(`
        id,
        user_id,
        restaurant_id,
        role,
        status,
        created_at,
        updated_at,
        profiles (
          id,
          email,
          full_name,
          phone,
          avatar_url
        )
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    return data.map((m: any) => {
      const prof = m.profiles || {};
      return {
        id: m.id,
        userId: m.user_id,
        restaurantId: m.restaurant_id,
        role: m.role as RestaurantRole,
        status: m.status as MemberStatus,
        fullName: prof.full_name || 'Staff Member',
        email: prof.email || 'staff@arsalankolkata.in',
        phone: prof.phone || null,
        avatarUrl: prof.avatar_url || null,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      };
    });
  },

  /**
   * Invite or assign an employee to the restaurant.
   */
  async inviteEmployee(payload: {
    restaurantId: string;
    email: string;
    role: RestaurantRole;
    fullName: string;
    phone?: string;
    requesterUserId?: string;
  }): Promise<StaffMember> {
    const cleanEmail = payload.email.trim().toLowerCase();

    // 1. Check if profile exists with this email
    let { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, avatar_url')
      .eq('email', cleanEmail)
      .maybeSingle();

    let userId = profile?.id;

    // If profile does not exist yet, create a placeholder profile
    if (!profile) {
      const tempId = crypto.randomUUID();
      const { data: newProf, error: profErr } = await supabase
        .from('profiles')
        .insert({
          id: tempId,
          email: cleanEmail,
          full_name: payload.fullName,
          phone: payload.phone || null,
        })
        .select()
        .single();

      if (profErr) {
        // Fallback to random UUID if error (e.g. FK constraint)
        userId = tempId;
      } else {
        userId = newProf.id;
        profile = newProf;
      }
    }

    // 2. Check if already a member
    const { data: existing } = await supabase
      .from('restaurant_members')
      .select('id')
      .eq('restaurant_id', payload.restaurantId)
      .eq('user_id', userId!)
      .maybeSingle();

    if (existing) {
      throw new Error(`This user (${cleanEmail}) is already a staff member in this restaurant.`);
    }

    // 3. Insert into restaurant_members
    const { data: member, error: memErr } = await supabase
      .from('restaurant_members')
      .insert({
        restaurant_id: payload.restaurantId,
        user_id: userId!,
        role: payload.role,
        status: 'invited',
      })
      .select()
      .single();

    if (memErr) throw memErr;

    // 4. Audit Log
    await supabase.from('audit_logs').insert({
      restaurant_id: payload.restaurantId,
      action: 'EMPLOYEE_INVITED',
      resource_type: 'restaurant_member',
      resource_id: member.id,
      user_id: payload.requesterUserId || null,
      details: {
        email: cleanEmail,
        fullName: payload.fullName,
        role: payload.role,
        status: 'invited',
      },
    });

    return {
      id: member.id,
      userId: member.user_id,
      restaurantId: member.restaurant_id,
      role: member.role,
      status: member.status,
      fullName: payload.fullName,
      email: cleanEmail,
      phone: payload.phone || null,
      createdAt: member.created_at,
      updatedAt: member.updated_at,
    };
  },

  /**
   * Update an employee's role (enforcing owner/manager privilege).
   */
  async updateEmployeeRole(payload: {
    restaurantId: string;
    memberId: string;
    newRole: RestaurantRole;
    requesterUserId?: string;
  }): Promise<void> {
    const { data: updated, error } = await supabase
      .from('restaurant_members')
      .update({
        role: payload.newRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.memberId)
      .eq('restaurant_id', payload.restaurantId)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await supabase.from('audit_logs').insert({
      restaurant_id: payload.restaurantId,
      action: 'ROLE_UPDATED',
      resource_type: 'restaurant_member',
      resource_id: payload.memberId,
      user_id: payload.requesterUserId || null,
      details: {
        newRole: payload.newRole,
        updatedAt: updated.updated_at,
      },
    });
  },

  /**
   * Update employee operational status (active / suspended).
   */
  async updateEmployeeStatus(payload: {
    restaurantId: string;
    memberId: string;
    newStatus: MemberStatus;
    requesterUserId?: string;
  }): Promise<void> {
    const { data: updated, error } = await supabase
      .from('restaurant_members')
      .update({
        status: payload.newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.memberId)
      .eq('restaurant_id', payload.restaurantId)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('audit_logs').insert({
      restaurant_id: payload.restaurantId,
      action: 'STATUS_UPDATED',
      resource_type: 'restaurant_member',
      resource_id: payload.memberId,
      user_id: payload.requesterUserId || null,
      details: {
        newStatus: payload.newStatus,
        updatedAt: updated.updated_at,
      },
    });
  },

  /**
   * Remove an employee from the restaurant.
   */
  async removeEmployee(payload: {
    restaurantId: string;
    memberId: string;
    requesterUserId?: string;
  }): Promise<void> {
    // Check if target is an owner
    const { data: target } = await supabase
      .from('restaurant_members')
      .select('role')
      .eq('id', payload.memberId)
      .eq('restaurant_id', payload.restaurantId)
      .single();

    if (target?.role === 'owner') {
      // Check how many owners remain
      const { count } = await supabase
        .from('restaurant_members')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', payload.restaurantId)
        .eq('role', 'owner');

      if ((count || 0) <= 1) {
        throw new Error('Cannot remove the sole restaurant owner.');
      }
    }

    const { error } = await supabase
      .from('restaurant_members')
      .delete()
      .eq('id', payload.memberId)
      .eq('restaurant_id', payload.restaurantId);

    if (error) throw error;

    await supabase.from('audit_logs').insert({
      restaurant_id: payload.restaurantId,
      action: 'EMPLOYEE_REMOVED',
      resource_type: 'restaurant_member',
      resource_id: payload.memberId,
      user_id: payload.requesterUserId || null,
      details: {
        removedMemberId: payload.memberId,
        timestamp: new Date().toISOString(),
      },
    });
  },

  /**
   * Fetch staff and operational audit history.
   */
  async getStaffAuditLogs(restaurantId: string): Promise<StaffAuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, action, resource_id, details, user_id, created_at')
      .eq('restaurant_id', restaurantId)
      .in('action', ['EMPLOYEE_INVITED', 'ROLE_UPDATED', 'STATUS_UPDATED', 'EMPLOYEE_REMOVED'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data || []).map((l) => ({
      id: l.id,
      action: l.action,
      resourceId: l.resource_id,
      details: l.details,
      userId: l.user_id,
      createdAt: l.created_at,
    }));
  },
};

export default employeeService;
