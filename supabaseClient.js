// const SUPABASE_URL = ;
// const SUPABASE_ANON_KEY = ;

let supabase = null;

async function initSupabase() {
  if (supabase) return supabase;
  
  try {
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm");
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabase;
  } catch (error) {
    console.error("Failed to initialize Supabase:", error);
    return null;
  }
}


function getUserId() {
  const key = "sb-user-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}


export function getFavoriteTeam() {
  return localStorage.getItem("fav-team");
}


export async function saveFavoriteTeam(team) {
  const userId = getUserId();
  localStorage.setItem("fav-team", team);
  
  const client = await initSupabase();
  if (!client) return null;
  
  try {
    const { data, error } = await client
      .from("user_preferences")
      .upsert({ 
        user_id: userId, 
        team: team,
        updated_at: new Date().toISOString()
      });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error saving team preference:", error);
    return null;
  }
}

export async function subscribeToTeamUpdates(team, onUpdate) {
  if (!team) return null;
  
  const client = await initSupabase();
  if (!client) return null;
  
  try {
    const channel = client
      .channel("team-updates")
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "game_updates",
          filter: `team=eq.${team}`
        },
        (payload) => {
          if (payload.new) {
            onUpdate(payload.new);
          }
        }
      )
      .subscribe();
    
    return channel;
  } catch (error) {
    console.error("Error subscribing to team updates:", error);
    return null;
  }
}

export function showNotification(title, message, team) {
  if (!chrome?.notifications) {
    console.warn("Notifications API not available");
    return;
  }
  
  chrome.notifications.create({
    type: "basic",
    iconUrl: "LogoExtension.png",
    title: title || "MLB Update",
    message: message,
    priority: 2
  });
}


export async function initTeamNotifications() {
  const favoriteTeam = getFavoriteTeam();
  if (!favoriteTeam) {
    console.log("No favorite team set - notifications disabled");
    return;
  }
  
  console.log(`Setting up notifications for ${favoriteTeam}`);
  
  await subscribeToTeamUpdates(favoriteTeam, (update) => {
    const message = update.message || 
      `${favoriteTeam} ${update.status}: ${update.away_score}-${update.home_score}`;
    
    showNotification("MLB Game Update", message, favoriteTeam);
    

    if (window.fetchScoresData) {
      window.fetchScoresData();
    }
  });
}

window.supabaseAPI = {
  getFavoriteTeam,
  saveFavoriteTeam,
  subscribeToTeamUpdates,
  showNotification,
  initTeamNotifications
};
