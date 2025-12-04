import { supabase } from '../lib/supabase';
import { User } from '@smartboard/home';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class AuthService {
    static async register(username: string, email: string, password: string): Promise<User> {
        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (existingUser) {
            throw new Error('User already exists');
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        const { data: newUser, error } = await supabase
            .from('users')
            .insert([{
                user_id: userId,
                user_name: username,
                email,
                password_hash: passwordHash,
                role: 'member'
            }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // unique_violation
                throw new Error('User already exists');
            }
            throw new Error(error.message);
        }

        // Remove password_hash from return
        const { password_hash, ...user } = newUser;
        return user as User;
    }

    static async login(email: string, password: string): Promise<{ user: User; token: string }> {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            throw new Error('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        const token = jwt.sign(
            { userId: user.user_id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        const { password_hash, ...userWithoutPassword } = user;
        return { user: userWithoutPassword as User, token };
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
}
