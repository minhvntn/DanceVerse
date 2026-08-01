import { io, Socket } from 'socket.io-client';

const URL = process.env.URL || 'http://localhost:3001';
const ROOM_ID = process.env.ROOM_ID || 'load-test-room';
const BOT_COUNT = parseInt(process.env.BOTS || '50', 10);
const MOVE_INTERVAL = 1000 / 15; // 15 Hz

const bots: Socket[] = [];
let connectedCount = 0;
let messagesReceived = 0;

console.log(`Starting Load Test with ${BOT_COUNT} bots connecting to ${URL}...`);

for (let i = 0; i < BOT_COUNT; i++) {
  setTimeout(() => {
    const socket = io(URL, { transports: ['websocket'] });

    socket.on('connect', () => {
      connectedCount++;
      socket.emit('room:join', {
        roomId: ROOM_ID,
        nickname: `Bot_${i}`,
        avatarType: 'Robot'
      });

      if (connectedCount === BOT_COUNT) {
        console.log(`\n✅ All ${BOT_COUNT} bots connected to room: ${ROOM_ID}`);
        startTest();
      }
    });

    socket.on('player:move', () => {
      messagesReceived++;
    });

    socket.on('disconnect', () => {
      connectedCount--;
    });

    bots.push(socket);
  }, i * 50); // Stagger connections
}

function startTest() {
  console.log('Beginning movement simulation...');
  
  // Simulate movement at 15Hz for all bots
  setInterval(() => {
    bots.forEach((bot, index) => {
      if (!bot.connected) return;
      // Random walk
      const x = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 40;
      
      bot.emit('player:move', {
        position: { x, y: 0, z },
        rotation: Math.random() * Math.PI * 2,
        animation: 'Walk'
      });
    });
  }, MOVE_INTERVAL);

  // Print metrics every 5 seconds
  setInterval(() => {
    const mem = process.memoryUsage();
    console.log(`\n--- Metrics ---`);
    console.log(`Connected Bots: ${connectedCount}`);
    console.log(`Msg/s Received: ${messagesReceived / 5}`);
    console.log(`RAM Usage: ${Math.round(mem.rss / 1024 / 1024)} MB`);
    messagesReceived = 0;
  }, 5000);
}
