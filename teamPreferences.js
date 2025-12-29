import { getFavoriteTeam, saveFavoriteTeam, initTeamNotifications } from './supabaseClient.js';


const MLB_TEAMS = [
  "Arizona Diamondbacks", "Atlanta Braves", "Baltimore Orioles", "Boston Red Sox",
  "Chicago Cubs", "Chicago White Sox", "Cincinnati Reds", "Cleveland Guardians",
  "Colorado Rockies", "Detroit Tigers", "Houston Astros", "Kansas City Royals",
  "Los Angeles Angels", "Los Angeles Dodgers", "Miami Marlins", "Milwaukee Brewers",
  "Minnesota Twins", "New York Mets", "New York Yankees", "Oakland Athletics",
  "Philadelphia Phillies", "Pittsburgh Pirates", "San Diego Padres", "San Francisco Giants",
  "Seattle Mariners", "St. Louis Cardinals", "Tampa Bay Rays", "Texas Rangers",
  "Toronto Blue Jays", "Washington Nationals"
];

export function createTeamSelector() {
  const container = document.createElement('div');
  container.id = 'team-selector-container';
  container.style.cssText = 'margin: 10px; padding: 10px; background: #f0f0f0; border-radius: 5px;';
  
  const label = document.createElement('label');
  label.textContent = 'Favorite Team (Get Notifications): ';
  label.style.cssText = 'font-weight: bold; margin-right: 10px;';
  
  const select = document.createElement('select');
  select.id = 'team-select';
  select.style.cssText = 'padding: 5px; border-radius: 3px; border: 1px solid #ccc;';
  
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- Select a team --';
  select.appendChild(defaultOption);
  
  MLB_TEAMS.forEach(team => {
    const option = document.createElement('option');
    option.value = team;
    option.textContent = team;
    select.appendChild(option);
  });
  
  const currentFavorite = getFavoriteTeam();
  if (currentFavorite) {
    select.value = currentFavorite;
  }
  
  select.addEventListener('change', async (e) => {
    const selectedTeam = e.target.value;
    if (selectedTeam) {
      await saveFavoriteTeam(selectedTeam);
      showToast(`Notifications enabled for ${selectedTeam}`);
      
      await initTeamNotifications();
    } else {
      localStorage.removeItem('fav-team');
      showToast('Team notifications disabled');
    }
  });
  
  container.appendChild(label);
  container.appendChild(select);
  
  return container;
}

// Show a temporary toast message
function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 20px;
    border-radius: 5px;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function initTeamPreferencesUI() {
  const header = document.querySelector('header');
  if (header) {
    const selector = createTeamSelector();
    header.insertBefore(selector, header.firstChild);
  }
}
