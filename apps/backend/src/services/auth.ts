import { supabase, supabaseAuth } from '../lib/supabase';
import { User } from '@smartboard/home';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class AuthService {
    static async register(username: string, email: string, password: string): Promise<User> {
        // 1) Check if profile exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('user_id')
            .eq('email', email)
            .maybeSingle();

        if (existingUser) throw new Error('User already exists');

        // 2) Create Supabase Auth user (requires service role key)
        const { data: created, error: createErr } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (createErr || !created?.user) {
            throw new Error(createErr?.message || 'Failed to create auth user');
        }

        // 3) Create public profile row
        const { data: newUser, error: profileErr } = await supabase
            .from('users')
            .insert([
                {
                    user_id: created.user.id,
                    user_name: username,
                    email,
                    role: 'member'
                }
            ])
            .select('user_id, user_name, email, role, created_at')
            .single();

        if (profileErr) {
            // Roll back auth user if profile creation fails
            await supabase.auth.admin.deleteUser(created.user.id);
            throw new Error(profileErr.message);
        }

        return newUser as any as User;
    }

    static async login(email: string, password: string): Promise<{ user: User; token: string }> {
        // Validate credentials using Supabase Auth
        const { data: signInData, error: signInErr } = await supabaseAuth.auth.signInWithPassword({
            email,
            password
        });

        if (signInErr || !signInData?.user) {
            throw new Error('Invalid credentials');
        }

        // Fetch profile
        let { data: user, error } = await supabase
            .from('users')
            .select('user_id, user_name, email, role, created_at')
            .eq('user_id', signInData.user.id)
            .maybeSingle();

        // If profile missing, create it (happens when auth user existed but profile row didn't)
        if (!user) {
            const { data: inserted, error: insertErr } = await supabase
                .from('users')
                .insert([
                    {
                        user_id: signInData.user.id,
                        user_name: signInData.user.email?.split('@')[0] || 'User',
                        email: signInData.user.email,
                        role: 'member'
                    }
                ])
                .select('user_id, user_name, email, role, created_at')
                .single();

            if (insertErr) throw new Error(insertErr.message);
            user = inserted;
        }

        // Keep your existing backend JWT so the current frontend keeps working
        const token = jwt.sign(
            { userId: user.user_id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return { user: user as any as User, token };
    }
    static async getAllUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('user_id, user_name, email, role, created_at');

        if (error) {
            throw new Error(error.message);
        }

        return data as any as User[];
    }

    static async updateUser(userId: string, updates: Partial<User>): Promise<User> {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('user_id', userId)
            .select('user_id, user_name, email, role, created_at')
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data as any as User;
    }

    static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        // 1) Get user email from profile
        const { data: profile, error: profileErr } = await supabase
            .from('users')
            .select('email')
            .eq('user_id', userId)
            .single();

        if (profileErr || !profile?.email) throw new Error('User not found');

        // 2) Verify current password by signing in
        const { error: signInErr } = await supabaseAuth.auth.signInWithPassword({
            email: profile.email,
            password: currentPassword
        });

        if (signInErr) throw new Error('Invalid current password');

        // 3) Update password in Supabase Auth
        const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
            password: newPassword
        });

        if (updateErr) throw new Error(updateErr.message);
    }
}
