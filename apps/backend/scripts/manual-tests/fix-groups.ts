
import { supabase } from '../../src/lib/supabase';

async function fixGroupOwnership() {
    console.log('--- Fixing Group Ownership & Cleaning Data ---');

    console.log('1. Fetching all groups...');
    const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('*');

    if (groupsError) {
        console.error('Error fetching groups:', groupsError);
        return;
    }

    console.log(`Found ${groups.length} groups.`);

    for (const group of groups) {
        // Skip DMs for now to focus on user groups, but DMs should also be fixed if buggy
        // Ideally DMs shouldn't have an 'owner' per se, but creators should be members.

        console.log(`Checking Group: ${group.name} (${group.group_id})`);

        // Ensure creator is OWNER in members table
        const { data: member, error: memberError } = await supabase
            .from('group_members')
            .select('*')
            .eq('group_id', group.group_id)
            .eq('user_id', group.user_id)
            .maybeSingle();

        if (member) {
            if (member.role !== 'owner') {
                console.log(`   -> Fixing role for owner ${group.user_id} (Current: ${member.role})`);
                await supabase
                    .from('group_members')
                    .update({ role: 'owner', can_manage_members: true })
                    .eq('group_id', group.group_id)
                    .eq('user_id', group.user_id);
            } else {
                console.log(`   -> Owner role is correct.`);
            }
        } else {
            console.log(`   -> Owner missing from members! Adding owner...`);
            await supabase.from('group_members').insert({
                group_id: group.group_id,
                user_id: group.user_id,
                role: 'owner',
                status: 'active',
                can_manage_members: true
            });
        }
    }

    // Clean up notifications with invalid JSON in metadata which might cause 500 errors if parsed poorly?
    // Actually, 500 in notifications is likely due to the UUID issue or something else.
    // Let's verify notifications table for the user in the screenshot if possible, but I don't have their ID handy 
    // without parsing logs. The 500 error suggests a SERVER CRASH or exception.
}

fixGroupOwnership().catch(console.error);
