# Chatrix Demo Guide

This guide walks you through testing all the key features of Chatrix.

## 🚀 Quick Start

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Open two browser windows:**
   - Window 1: `http://localhost:3001` (Room Creator)
   - Window 2: `http://localhost:3001` (Room Joiner)

## 📋 Demo Steps

### Step 1: Create a Room

**In Window 1:**
1. Click "Create Room"
2. Fill in the form:
   - **Room Name**: "Demo Chat Room"
   - **Tags**: Add tags like "demo", "testing", "fun"
   - **Lock Room**: Check the box
   - **Password**: Enter "demo123"
3. Click "Create Room"
4. You should automatically join the room as the admin

### Step 2: Join the Room

**In Window 2:**
1. You should see "Demo Chat Room" in the room list
2. Click "Join Room"
3. Enter password "demo123" when prompted
4. Click "Join Room"
5. You should now be in the chat room

### Step 3: Test Messaging

**In both windows:**
1. Type messages in the input field
2. Press Enter or click Send
3. Messages should appear in real-time in both windows
4. Notice the different user names (anonymous1, anonymous2, etc.)

### Step 4: Test Voice Chat

**In both windows:**
1. Click the microphone button to enable voice
2. Grant microphone permission when prompted
3. Speak into your microphone
4. The other window should receive your voice
5. Click the microphone button again to mute/unmute

### Step 5: Test Admin Controls

**In Window 1 (Admin):**
1. Click the Settings (gear) icon to open admin controls
2. You should see the other user in the admin panel
3. Click the kick button (UserX icon) next to the other user
4. Confirm the kick action
5. The other user should be temporarily removed

**In Window 2:**
1. You should see a "kicked" notification
2. Try to rejoin the room - it should be blocked for 1 minute

### Step 6: Test Room Filtering

**In Window 2:**
1. Go back to the room list
2. Use the search bar to search for "demo"
3. Use the tag filters to filter by "testing"
4. Try adding a custom tag filter

### Step 7: Test Room Creation Variations

**Create different types of rooms:**
1. **Open Room**: No password, just name and tags
2. **Locked Room**: With password protection
3. **Tagged Room**: With multiple tags for filtering
4. **Long Name Room**: Test the 50-character limit

### Step 8: Test Mobile Responsiveness

1. Open the app on a mobile device or use browser dev tools
2. Test the responsive design
3. Verify all features work on mobile

## 🎯 Feature Checklist

### ✅ Core Features
- [ ] Create room with name and tags
- [ ] Lock room with password
- [ ] Join room (open and locked)
- [ ] Real-time messaging
- [ ] Anonymous user naming
- [ ] Room search and filtering
- [ ] User list display
- [ ] Leave room functionality

### ✅ Voice Features
- [ ] Enable/disable voice chat
- [ ] Microphone permission handling
- [ ] Mute/unmute functionality
- [ ] Voice status indicators
- [ ] WebRTC peer connections

### ✅ Admin Features
- [ ] Kick user (temporary)
- [ ] Ban user (permanent)
- [ ] Admin controls visibility
- [ ] User management interface

### ✅ UI/UX Features
- [ ] Red theme implementation
- [ ] Responsive design
- [ ] Smooth animations
- [ ] Loading states
- [ ] Error handling
- [ ] Transcript download

### ✅ Security Features
- [ ] Rate limiting
- [ ] XSS protection
- [ ] Password hashing
- [ ] Input validation

## 🐛 Testing Edge Cases

### Connection Issues
1. **Disconnect/Reconnect**: Close one browser tab and reopen
2. **Network Issues**: Disable network temporarily
3. **Server Restart**: Restart the backend server

### Error Scenarios
1. **Invalid Password**: Try wrong password for locked room
2. **Rate Limiting**: Send messages rapidly to test rate limit
3. **Long Messages**: Test 1000+ character messages
4. **Special Characters**: Test messages with HTML/script tags

### Performance Testing
1. **Multiple Rooms**: Create 10+ rooms and test switching
2. **Many Users**: Open 5+ browser tabs in same room
3. **Long Sessions**: Keep app open for extended periods

## 📊 Expected Results

### Room Creation
- Room appears in list immediately
- Room shows correct user count
- Tags are displayed properly
- Locked rooms show lock icon

### Messaging
- Messages appear instantly in all windows
- User names are assigned correctly
- Timestamps are accurate
- System messages for joins/leaves

### Voice Chat
- Microphone permission prompt appears
- Voice indicator shows speaking status
- Audio quality is clear
- Mute/unmute works properly

### Admin Controls
- Only room creator sees admin controls
- Kick/ban actions work immediately
- Banned users cannot rejoin
- Kicked users have cooldown period

## 🔧 Troubleshooting

### Common Issues

**"Connection failed"**
- Check if backend server is running on port 3000
- Verify no firewall blocking the connection

**"Microphone not working"**
- Check browser permissions
- Try refreshing the page
- Test in different browser

**"Room not appearing"**
- Refresh the room list
- Check if room was created successfully
- Verify search filters

**"Messages not sending"**
- Check rate limiting (100 messages/minute)
- Verify you're in the room
- Check browser console for errors

### Debug Information

**Backend Logs:**
```bash
cd backend
npm run dev
# Watch console for connection logs
```

**Frontend Console:**
- Open browser dev tools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

## 🎉 Success Criteria

The demo is successful if:
1. ✅ Two users can join the same room
2. ✅ Messages appear in real-time
3. ✅ Voice chat works between users
4. ✅ Admin can kick/ban users
5. ✅ Room filtering and search work
6. ✅ Mobile responsiveness is good
7. ✅ No critical errors in console
8. ✅ All UI elements are functional

## 📝 Demo Script

For presentations, follow this 5-minute script:

1. **Introduction (30s)**: "Chatrix is a real-time anonymous chat app"
2. **Create Room (1m)**: Show room creation with tags and password
3. **Join Room (1m)**: Join from second browser, show real-time messaging
4. **Voice Chat (1m)**: Enable voice, demonstrate audio communication
5. **Admin Controls (1m)**: Show kick/ban functionality
6. **Features (1.5m)**: Quick tour of search, filters, mobile view

---

**Ready to demo Chatrix!** 🚀
