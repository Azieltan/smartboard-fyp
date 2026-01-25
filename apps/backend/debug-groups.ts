
import { supabase } from './src/lib/supabase';

async function verifyGroupData() {
    console.log('--- Verifying Group Data ---');

    // 1. Get all groups
    const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('*');

    if (groupsError) {
        console.error('Error fetching groups:', groupsError);
        return;
    }

    console.log(`Found ${groups.length} groups.`);

    for (const group of groups) {
        console.log(`\nGroup: ${group.name} (ID: ${group.group_id})`);
        console.log(`   - Owner ID: ${group.user_id}`);
        console.log(`   - Requires Approval: ${group.requires_approval}`);
        console.log(`   - Join Code: ${group.join_code}`);

        // 2. Get Members
        const { data: members, error: membersError } = await supabase
            .from('group_members')
            .select('user_id, role, status')
            .eq('group_id', group.group_id);

        if (membersError) {
            console.error('   Error fetching members:', membersError);
            continue;
        }

        console.log(`   - Total Members: ${members.length}`);

        const owners = members.filter(m => m.role === 'owner');
        const admins = members.filter(m => m.role === 'admin');
        const pending = members.filter(m => m.status === 'pending');
        const active = members.filter(m => m.status === 'active');

        console.log(`   - Roles: Owner(${owners.length}), Admin(${admins.length})`);
        console.log(`   - Status: Active(${active.length}), Pending(${pending.length})`);

        if (pending.length > 0) {
            console.log('   !!! HAS PENDING REQUESTS !!!');
            pending.forEach(p => console.log(`      - Pending User ID: ${p.user_id}`));
        } else {
            console.log('   - No pending requests.');
        }

        // Check if the group owner is actually in the members list
        const ownerInMembers = members.find(m => m.user_id === group.user_id);
        if (!ownerInMembers) {
            console.error('   CRITICAL: Group Creator (Owner) is NOT in the members list!');
        } else {
            console.log(`   - Owner verified in members list with role: ${ownerInMembers.role}`);
        }
    }
}

verifyGroupData().catch(console.error);
