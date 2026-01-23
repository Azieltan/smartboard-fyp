
import { supabase } from './src/lib/supabase';

async function fixNotificationsAndCheckTestGroup() {
    console.log('--- Cleaning Notifications & Checking Group "test" ---');

    // 1. Clear all notifications (nuclear option to fix 500 error)
    // In production we would be more careful, but for dev debug this is safest to restore functionality
    const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
        console.error('Error clearing notifications:', deleteError);
    } else {
        console.log('Successfully cleared ALL notifications.');
    }

    // 2. Check "test" group specifically
    const { data: groups, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .ilike('name', '%test%'); // Search for groups named "test"

    if (groupError || !groups) {
        console.error('Error fetching test groups:', groupError);
        return;
    }

    console.log(`\nFound ${groups.length} groups with "test" in name:`);

    for (const group of groups) {
        console.log(`\n--------------------------------------------------`);
        console.log(`Group Name: "${group.name}"`);
        console.log(`Group ID:   ${group.group_id}`);
        console.log(`Owner ID:   ${group.user_id}`);
        console.log(`Approval?:  ${group.requires_approval}`);
        console.log(`Join Code:  ${group.join_code}`);

        // Get Members
        const { data: members } = await supabase
            .from('group_members')
            .select('user_id, role, status')
            .eq('group_id', group.group_id);

        const pending = members?.filter(m => m.status === 'pending') || [];
        const active = members?.filter(m => m.status === 'active') || [];

        console.log(`Active Members:  ${active.length}`);
        console.log(`Pending Requests: ${pending.length}`);

        if (pending.length > 0) {
            console.log(`PENDING USERS:`);
            pending.forEach(p => console.log(` - ${p.user_id}`));
        } else {
            console.log(`(No pending requests found in database)`);
        }
    }
}

fixNotificationsAndCheckTestGroup().catch(console.error);
