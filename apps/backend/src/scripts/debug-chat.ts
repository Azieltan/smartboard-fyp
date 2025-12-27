
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { supabase } from '../lib/supabase';
import { ChatService } from '../services/chat';
import { GroupService } from '../services/group';

async function main() {
  console.log('Starting Chat Debug...');

  // 1. Get a valid user
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('user_id')
    .limit(1)
    .single();

  if (userError || !user) {
    console.error('Failed to get user:', userError);
    return;
  }
  const userId = user.user_id;

  // 2. Get or Create a Group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('group_id')
    .limit(1)
    .single();

  let groupId = group?.group_id;

  if (!groupId) {
    console.log('No group found, creating one...');
    // Create dummy group
    const newGroup = await GroupService.createGroup('Debug Group', userId, false, [], {});
    groupId = newGroup.group_id;
  }

  console.log(`Testing with User: ${userId}, Group: ${groupId}`);

  // 3. Simulate backend index.ts logic
  try {
    console.log('Step 1: Get Chat by Group ID');
    let chat = await ChatService.getChatByGroupId(groupId);

    if (!chat) {
      console.log('Chat not found, creating...');
      chat = await ChatService.createChat(groupId);
    }
    console.log('Chat ID:', chat.chat_id);

    console.log('Step 2: Send Message');
    const content = 'Debug message from script ' + new Date().toISOString();

    const message = await ChatService.sendMessage(chat.chat_id, userId, content);
    console.log('SUCCESS: Message sent!');
    console.log(message);

  } catch (error: any) {
    console.error('FAILURE: Debug script caught error:');
    console.error(error);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    if (error.message) {
      console.error('Error message:', error.message);
    }
  }
}

main();
