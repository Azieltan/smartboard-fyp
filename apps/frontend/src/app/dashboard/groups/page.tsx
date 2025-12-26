import GroupDetailView from '../../../components/GroupDetailView';

// ... (interfaces remain the same)

export default function GroupsPage() {
    const [activeTab, setActiveTab] = useState<'groups' | 'friends'>('groups');
    const [groups, setGroups] = useState<Group[]>([]);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [showAddFriend, setShowAddFriend] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [selectedGroupForAdd, setSelectedGroupForAdd] = useState<string | null>(null);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [isJoiningGroup, setIsJoiningGroup] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [newGroupName, setNewGroupName] = useState('');
    const [userId, setUserId] = useState<string>('');
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null); // New State

    // ... (useEffect and fetch remain the same) 

    // ... (handlers remain the same)

    // Early return for Detail View
    if (selectedGroupId && userId) {
        return (
            <GroupDetailView
                groupId={selectedGroupId}
                userId={userId}
                onBack={() => {
                    setSelectedGroupId(null);
                    fetchData(userId); // Refresh list on back
                }}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header, Tabs, Modals code... */}

            {/* ... inside return ... */}

            <div
                key={group.group_id}
                onClick={() => setSelectedGroupId(group.group_id)}
                className="glass-panel p-6 hover:border-blue-500/30 transition-colors group cursor-pointer"
            >
                {/* ... card content ... */}
                {/* Update View Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGroupId(group.group_id);
                    }}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-white transition-colors"
                >
                    View
                </button>
                {/* ... */}
            </div>
            {/* ... */}
        </div>
    );
}
