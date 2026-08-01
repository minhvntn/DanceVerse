const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server', '..', 'client', 'src', 'components', 'hud', 'HostControlPanel.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add RoleManagementPanel import
content = content.replace(
  `import { SOCKET_EVENTS, RoomVisibility } from '../../types';`,
  `import { SOCKET_EVENTS, RoomVisibility } from '../../types';\nimport { RoleManagementPanel } from '../../features/room-roles/components/RoleManagementPanel';`
);

// Update Props
content = content.replace(
  `interface HostControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  hostToken?: string;
}

export const HostControlPanel: React.FC<HostControlPanelProps> = ({
  isOpen,
  onClose,
  roomId,
  hostToken
}) => {
  const { currentRoom, players, playlist, musicState } = useRoomStore();`,
  `interface HostControlPanelProps {
  onClose: () => void;
}

export const HostControlPanel: React.FC<HostControlPanelProps> = ({
  onClose
}) => {
  const { currentRoom, players, playlist, musicState, hostToken } = useRoomStore();
  const roomId = currentRoom?.id || '';`
);

// Remove isOpen check
content = content.replace(
  `if (!isOpen || !currentRoom) return null;`,
  `if (!currentRoom) return null;`
);

// Add Roles to activeTab state
content = content.replace(
  `const [activeTab, setActiveTab] = useState<'room' | 'music' | 'players'>('room');`,
  `const [activeTab, setActiveTab] = useState<'room' | 'music' | 'players' | 'roles'>('room');`
);

// Add Tab Button for Roles
content = content.replace(
  `            <button
              onClick={() => setActiveTab('players')}
              className={\`flex-1 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all \${
                activeTab === 'players'
                  ? 'border-neon-pink text-neon-pink bg-neon-pink/10'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }\`}
            >
              Players
            </button>`,
  `            <button
              onClick={() => setActiveTab('players')}
              className={\`flex-1 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all \${
                activeTab === 'players'
                  ? 'border-neon-pink text-neon-pink bg-neon-pink/10'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }\`}
            >
              Players
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={\`flex-1 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all \${
                activeTab === 'roles'
                  ? 'border-neon-pink text-neon-pink bg-neon-pink/10'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }\`}
            >
              Roles
            </button>`
);

// Add rendering logic for Roles tab
content = content.replace(
  `{/* Settings Tab */}`,
  `{/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="p-4 overflow-y-auto h-full space-y-4">
            <RoleManagementPanel />
          </div>
        )}

        {/* Settings Tab */}`
);

fs.writeFileSync(filePath, content);
console.log('Successfully updated HostControlPanel.tsx');
