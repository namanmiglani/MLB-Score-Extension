# Testing Guide for Daily Draft & Player Stat Picks Games

## Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `MLB-Score-Extension` folder
5. The extension should now appear in your extensions bar

## Testing Daily Draft

### 1. Access Daily Draft
- Click the extension icon to open popup
- Click "🎮 Games" dropdown in the header
- Select "💰 Daily Draft"

### Expected Behavior:
- Should show lineup grid with 9 empty slots (C, 1B, 2B, 3B, SS, OF×3, P)
- Budget display should show $50,000 remaining
- Players list should load (showing probable pitchers + mock hitters)
- Position filters should appear (ALL, C, 1B, 2B, 3B, SS, OF, P)

### 2. Add Players to Lineup
- Filter by position (e.g., click "C" to see catchers)
- Click "Add to Lineup" on a player card
- Player should appear in corresponding lineup slot
- Budget should decrease by player's salary
- Player card button should change to "In Lineup" and be disabled

### 3. Complete Lineup
- Add all 9 players (one for each position)
- "Submit Lineup" button should become enabled when all slots filled
- Click "Submit Lineup"
- Should show confirmation dialog

### 4. Test Budget Constraints
- Try adding expensive players until budget is low
- Attempt to add a player you can't afford
- Should see "Cannot Afford" alert

## Testing Player Stat Picks

### 1. Access Stat Picks
- Click extension icon
- Click "🎮 Games" dropdown
- Select "🎯 Stat Picks"

### Expected Behavior:
- Should show streak display (Current: 0, Best: 0)
- Should show "Today's Picks" section
- Should generate ~5 picks (3 Over/Under, 2 Head-to-Head, 1 Prop)

### 2. Over/Under Picks
- Should show player name, team logo, opponent
- Should show stat line (e.g., "Total Bases: 2.5")
- Should show season average for comparison
- Click "OVER" or "UNDER" button
- Button should highlight with blue background
- Selection should be saved

### 3. Head-to-Head Picks
- Should show two players side-by-side with "VS" between them
- Shows stat to compare (e.g., "Who will get more hits?")
- Click either player's button to make selection
- Selected player card should highlight

### 4. Prop Picks
- Shows yes/no question (e.g., "Will there be a no-hitter?")
- Shows context information
- Click YES or NO
- Selection should highlight

### 5. Refresh Picks
- Click the refresh button (↻) in header
- Should regenerate new picks for today
- Previous selections should be cleared

## Testing Navigation

### 1. View Switching
- From any game view, click "← Back" button
- Should return to Scores view
- Date navigation should reappear
- Live score updates should resume

### 2. Dropdown Menu
- Hover over "🎮 Games" button
- Dropdown should appear with both game options
- Click outside - dropdown should close

## Testing Data Persistence

### 1. Chrome Sync Storage
- Make picks in Stat Picks view
- Build a lineup in Daily Draft
- Close the extension popup completely
- Reopen the extension
- Navigate back to game views
- **Expected:** Picks and lineup should be preserved

### 2. Cross-Device Sync (if you have Chrome sync enabled)
- Make picks on one device
- Open extension on another device with same Chrome account
- **Expected:** Picks should sync across devices

## Known Limitations (Demo Mode)

1. **Player Data**: Currently uses probable pitchers from today's games + mock position players
   - In production, would fetch full team rosters
   
2. **Live Scoring**: Not yet implemented
   - Draft lineups won't show points until scoring engine is connected
   - Picks won't auto-resolve after games complete
   
3. **History Views**: History buttons show alerts instead of detailed modals
   - "View History" and "View Pick History" are placeholders
   
4. **Off-Season**: If no MLB games scheduled, player list will be empty
   - Consider testing during baseball season (March-October)

## Troubleshooting

### Extension Not Loading
- Check browser console (F12) for errors
- Verify all JavaScript files are present
- Ensure manifest.json is valid

### Players Not Loading
- Check if today's date has scheduled MLB games
- Open browser console and look for API errors
- Verify MLB Stats API is accessible

### Storage Errors
- Check that "storage" permission is in manifest.json
- Clear extension storage: `chrome://extensions/` → Extension details → "Clear storage"

### Styling Issues
- Ensure style.css has all new game styles (check file size ~20KB)
- Clear browser cache and reload extension

## API Endpoints Used

1. **Today's Schedule**: `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date={date}&hydrate=probablePitcher,team`
2. **Player Stats**: `https://statsapi.mlb.com/api/v1/people/{playerId}/stats?stats=season&group=hitting,pitching`
3. **Live Game Data**: `https://statsapi.mlb.com/api/v1/game/{gamePk}/feed/live`

## Console Debugging

Open browser console (F12) and look for:
- `"Switching to [view] view"` - View navigation logs
- `"Loading players..."` - Player data fetch
- `"Generating today's picks..."` - Pick generation
- Any red errors indicating API or storage issues

## Success Criteria

✅ All views load without errors
✅ Players display with correct salaries and stats
✅ Lineup updates correctly when adding/removing players
✅ Budget calculation is accurate
✅ Picks generate and selections can be made
✅ Data persists after closing popup
✅ Navigation between views works smoothly
✅ No console errors

## Next Steps After Testing

1. Test during active MLB season for real game data
2. Implement live scoring engine for drafts
3. Implement pick auto-resolution after games complete
4. Add detailed history modals
5. Add streak milestone animations
6. Consider full roster fetching instead of mock data
7. Add loading states for better UX
