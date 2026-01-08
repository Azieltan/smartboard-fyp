
import { supabase } from '../lib/supabase';

async function main() {
    try {
        console.log("Inspecting subtasks table schema...");

        // Retrieve one row to see structure
        const { data, error } = await supabase
            .from('subtasks')
            .select('*')
            .limit(1);

        if (error) {
            console.error("Error selecting subtasks:", error.message);
        } else {
            console.log("Subtask row sample:", data);
        }

    } catch (error: any) {
        console.error("Unexpected error:", error);
    }
}

main();
