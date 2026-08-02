import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '../server/src/shared/events';

const TARGET_URL = process.argv[2] || 'http://localhost:3001';
const ROOM_ID = process.argv[3] || 'room-1';
const NUM_BOTS = parseInt(process.argv[4] || '100', 10);

console.log(`Starting load test with ${NUM_BOTS} bots against ${TARGET_URL} targeting room ${ROOM_ID}`);

const bots: any[] = [];
let connectedCount = 0;

for (let i = 0; i < NUM_BOTS; i++) {
  setTimeout(() => {
    const socket = io(TARGET_URL, {
      reconnection: true,
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      connectedCount++;
      console.log(`Bot ${i} connected. Total connected: ${connectedCount}/${NUM_BOTS}`);
      
      // Join Room
      socket.emit(SOCKET_EVENTS.ROOM_JOIN, {
        roomId: ROOM_ID,
        nickname: `Bot_${i}`,
        avatarType: 'Boy',
        avatarConfig: null,
      });

      // Start moving randomly every 66ms (15Hz)
      setInterval(() => {
        socket.emit(SOCKET_EVENTS.PLAYER_MOVE, {
          position: {
            x: (Math.random() - 0.5) * 40,
            z: (Math.random() - 0.5) * 40
          },
          rotation: Math.random() * Math.PI * 2,
          animation: 'Idle',
          seq: Date.now()
        });
      }, 66);
    });

    socket.on('disconnect', () => {
      connectedCount--;
      console.log(`Bot ${i} disconnected. Total connected: ${connectedCount}/${NUM_BOTS}`);
    });

    socket.on('connect_error', (err) => {
      console.error(`Bot ${i} connection error:`, err.message);
    });

    bots.push(socket);
  }, i * 20); // Stagger connections by 20ms
}
