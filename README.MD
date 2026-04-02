# Baseball Scoreboard - MLB Box Score

<div align="center">

![Extension Preview](UpdatedExtesnionPic.png)

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-blue?logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/baseball-scoreboard-mlb-b/kfooeopgnpkdjfacnnofdfmknhandiml)
[![Users](https://img.shields.io/badge/Users-400%2B-success)](https://chromewebstore.google.com/detail/baseball-scoreboard-mlb-b/kfooeopgnpkdjfacnnofdfmknhandiml)
[![Installs](https://img.shields.io/badge/Total%20Installs-2.23K-blue)](https://chromewebstore.google.com/detail/baseball-scoreboard-mlb-b/kfooeopgnpkdjfacnnofdfmknhandiml)
[![Version](https://img.shields.io/badge/version-2.0.1-green.svg)](manifest.json)

**A comprehensive Chrome extension for tracking live MLB scores, standings, and playing fantasy games**

[Install Extension](https://chromewebstore.google.com/detail/baseball-scoreboard-mlb-b/kfooeopgnpkdjfacnnofdfmknhandiml)

</div>

---

## Overview

Baseball Scoreboard is a feature-rich Chrome extension that brings the complete MLB experience to your browser. Track live game scores, view comprehensive standings, and compete in daily fantasy games - all from a convenient popup interface.

## Features

### Live Game Tracking
- **Real-time Score Updates** - Get live MLB game scores as they happen
- **Inning-by-Inning Updates** - Follow games pitch-by-pitch with live inning status
- **Game Status Indicators** - See at a glance which games are In Progress, Final, or Scheduled
- **Date Navigation** - Browse scores from any past or future day
- **Box Score Links** - Quick access to detailed game statistics
- **Team Logos & Abbreviations** - Visual team identification


### Additional Features
- **Chrome Sync Storage** - Access picks and lineups across all your devices
- **Team Preferences** - Set favorite team for personalized notifications (coming soon)

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Data Scraping:** Python
- **API:** MLB Stats API
- **Storage:** Chrome Storage API (sync & local)

## Installation

### From Chrome Web Store (Recommended)
1. Visit the [Chrome Web Store listing](https://chromewebstore.google.com/detail/baseball-scoreboard-mlb-b/kfooeopgnpkdjfacnnofdfmknhandiml)
2. Click "Add to Chrome"
3. Click the extension icon in your toolbar to start using it


### Project Structure
```
MLB-Score-Extension/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── scores.js             # Score display logic
├── standings.js          # Standings logic
├── style.css             # Styling
├── server.js             # Express backend server
├── webscrape.py          # MLB data scraping
├── images/               # Team logos and assets
└── Standings/            # Standings-related files
```

## Roadmap

### Completed Features
- [x] Previous and future day navigation
- [x] Full box scores
- [x] Game inning status
- [x] Complete MLB standings


### Upcoming Features
- [ ] Push notifications for favorite team games
- [ ] Live player statistics in games
- [ ] Dark mode theme
- [ ] Detailed history modals for Draft/Picks
- [ ] Advanced streak statistics and performance graphs
- [ ] Player comparison tools
- [ ] Customizable alerts and reminders

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.



## Support

If you enjoy using Baseball Scoreboard, please consider:
- ⭐ Starring this repository
- 📝 Leaving a review on the Chrome Web Store
- 🐛 Reporting bugs or suggesting features

---

<div align="center">

**Made for baseball fans, by baseball fans**

[Chrome Web Store](https://chromewebstore.google.com/detail/baseball-scoreboard-mlb-b/kfooeopgnpkdjfacnnofdfmknhandiml) • v2.0.1

</div>
