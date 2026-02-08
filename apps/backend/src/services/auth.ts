import { supabase, supabaseAuth } from '../lib/supabase';
import { User } from '@smartboard/home';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class AuthService {
    static async register(username: string, email: string, password: string): Promise<{ user: User; token: string }> {
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
            email_confirm: true,
            user_metadata: { user_name: username }
        });

        if (createErr || !created?.user) {
            // Common Supabase error when email already exists
            const msg = createErr?.message || 'Failed to create auth user';
            if (/already\s*registered|already\s*exists/i.test(msg)) throw new Error('User already exists');
            throw new Error(msg);
        }

        // 3) Create/update public profile row.
        // If you have an auth.users -> public.users trigger, it may have already inserted this row.
        // Using upsert avoids duplicate key violations.
        const { data: newUser, error: profileErr } = await supabase
            .from('users')
            .upsert(
                {
                    user_id: created.user.id,
                    user_name: username,
                    email,
                    role: 'member'
                },
                { onConflict: 'user_id' }
            )
            .select('user_id, user_name, email, role, created_at')
            .single();

        if (profileErr) {
            // Roll back auth user if profile creation fails
            await supabase.auth.admin.deleteUser(created.user.id);
            throw new Error(profileErr.message);
        }

        // 4) Generate JWT token
        const token = jwt.sign(
            { userId: newUser.user_id, email: newUser.email, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return { user: newUser as any as User, token };
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

        // If profile missing, create it. Or if name is generic/default, try to update it from metadata.
        const metaName = signInData.user.user_metadata?.user_name || signInData.user.user_metadata?.full_name || signInData.user.user_metadata?.name;

        if (!user) {
            const { data: inserted, error: insertErr } = await supabase
                .from('users')
                .upsert(
                    {
                        user_id: signInData.user.id,
                        user_name: metaName || signInData.user.email?.split('@')[0] || 'User',
                        email: signInData.user.email,
                        role: 'member'
                    },
                    { onConflict: 'user_id' }
                )
                .select('user_id, user_name, email, role, created_at')
                .single();

            if (insertErr) throw new Error(insertErr.message);
            user = inserted;
        } else if (metaName && (user.user_name === 'User' || user.user_name === 'user' || user.user_name === 'Users')) {
            // Update the existing generic name to the one from metadata if available
            const { data: updated, error: updateErr } = await supabase
                .from('users')
                .update({ user_name: metaName })
                .eq('user_id', user.user_id)
                .select('user_id, user_name, email, role, created_at')
                .single();

            if (!updateErr && updated) {
                user = updated;
            }
        }

        // Keep your existing backend JWT so the current frontend keeps working
        const token = jwt.sign(
            { userId: user.user_id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return { user: user as any as User, token };
    }

    static async syncSession(accessToken: string): Promise<{ user: User; token: string }> {
        // 1. Verify token with Supabase
        const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser(accessToken);

        if (authError || !authUser) {
            throw new Error('Invalid or expired session');
        }

        // 2. Fetch or Create Profile in public.users
        let { data: user, error } = await supabase
            .from('users')
            .select('user_id, user_name, email, role, created_at')
            .eq('user_id', authUser.id)
            .maybeSingle();

        const email = authUser.email || (authUser.phone ? `${authUser.phone}@phone.ws` : `${authUser.id}@placeholder.ws`);
        const metaName = authUser.user_metadata?.user_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name;
        const fallbackName = authUser.phone || email.split('@')[0] || 'User';

        if (!user) {
            const { data: inserted, error: insertErr } = await supabase
                .from('users')
                .upsert(
                    {
                        user_id: authUser.id,
                        user_name: metaName || fallbackName,
                        email: email,
                        role: 'member'
                    },
                    { onConflict: 'user_id' }
                )
                .select('user_id, user_name, email, role, created_at')
                .single();

            if (insertErr) throw new Error(insertErr.message);
            user = inserted;
        } else if (metaName && (user.user_name === 'User' || user.user_name === 'user' || user.user_name === 'Users')) {
            // Update the existing generic name to the one from metadata if available
            const { data: updated, error: updateErr } = await supabase
                .from('users')
                .update({ user_name: metaName })
                .eq('user_id', user.user_id)
                .select('user_id, user_name, email, role, created_at')
                .single();

            if (!updateErr && updated) {
                user = updated;
            }
        }

        // 3. Generate internal App JWT
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

    static async searchUser(query: string): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('user_id, user_name, email, role, created_at')
            .or(`email.ilike.%${query}%,user_name.ilike.%${query}%,user_id.eq.${query}`)
            .limit(5);

        if (error) throw new Error(error.message);
        return data as any as User[];
    }

    /**
     * Sync OAuth user (Google, etc) - creates or updates user profile and returns JWT
     */
    static async syncOAuthUser(
        supabaseUserId: string,
        email: string,
        displayName?: string,
        avatarUrl?: string
    ): Promise<{ user: User; token: string; isNewUser: boolean }> {
        // Check if user already exists
        let { data: existingUser } = await supabase
            .from('users')
            .select('user_id, user_name, email, role, created_at')
            .eq('user_id', supabaseUserId)
            .maybeSingle();

        let isNewUser = false;

        if (!existingUser) {
            // Create new user profile
            isNewUser = true;
            const userName = displayName || email.split('@')[0] || 'User';

            const { data: newUser, error: insertErr } = await supabase
                .from('users')
                .insert({
                    user_id: supabaseUserId,
                    user_name: userName,
                    email: email,
                    role: 'member'
                })
                .select('user_id, user_name, email, role, created_at')
                .single();

            if (insertErr) throw new Error(insertErr.message);
            existingUser = newUser;
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: existingUser.user_id, email: existingUser.email, role: existingUser.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return {
            user: existingUser as any as User,
            token,
            isNewUser
        };
    }
}
