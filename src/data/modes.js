// ============================================================================
// Build Your GOAT — mode data: every game mode's sport, category set, roster.
// ROSTERS[mode] -> Player[]; MODES[mode] declares sport + category set + label.
// Shape mirrors players.js so a roster feeds straight into the reel/scoring.
//
// PHOTOS: only NBA players carry an `nbaId` (real headshot CDN). Soccer +
// EuroLeague players have none, so their cards fall back to the CSS jersey/
// monogram art automatically (see playerCard.js) — nothing breaks.
// ============================================================================

import { CATEGORIES } from './categories.js';
import { PLAYERS, headshotUrl } from './players.js';

// --- SOCCER skill slots (basketball modes reuse the existing CATEGORIES) -----
/** @type {{id:string,label:string,icon:string,tagline:string,accent:string}[]} */
export const SOCCER_CATEGORIES = Object.freeze([
  scat('pace', 'Pace', '⚡', 'Burners and acceleration', '#ffd60a'),
  scat('shooting', 'Shooting', '🎯', 'Finishing and power', '#ff6b35'),
  scat('passing', 'Passing', '🪄', 'Vision and range', '#4cc9f0'),
  scat('dribbling', 'Dribbling', '🕺', 'Close control and flair', '#7b2ff7'),
  scat('defending', 'Defending', '🛡️', 'Tackling and marking', '#06d6a0'),
  scat('physical', 'Physical', '💪', 'Strength and stamina', '#ef476f'),
]);

function scat(id, label, icon, tagline, accent) {
  return Object.freeze({ id, label, icon, tagline, accent });
}

// --- builders (two sports key attrs by different ids) ------------------------
function hoops(id, name, short, mono, num, team, era, colors, attrs, nbaId = null) {
  return Object.freeze({ id, name, short, monogram: mono, number: num, team, era, colors: Object.freeze(colors), attrs: Object.freeze(attrs), nbaId });
}
function soc(id, name, short, mono, num, team, era, colors, attrs) {
  return Object.freeze({ id, name, short, monogram: mono, number: num, team, era, colors: Object.freeze(colors), attrs: Object.freeze(attrs), nbaId: null });
}

// === BASKETBALL — NBA (current, 2025-26) ====================================
const NBA_CURRENT = [
  hoops('sga', 'Shai Gilgeous-Alexander', 'Gilgeous-Alexander', 'SGA', 2, 'OKC', '2020s', ['#007AC1', '#EF3B24'],
    { scoring: 97, playmaking: 90, defense: 88, athleticism: 90, clutch: 96, leadership: 92 }, 1628983),
  hoops('jokic', 'Nikola Jokić', 'Jokić', 'NJ', 15, 'DEN', '2020s', ['#0E2240', '#FEC524'],
    { scoring: 95, playmaking: 99, defense: 82, athleticism: 78, clutch: 93, leadership: 95 }, 203999),
  hoops('wemby', 'Victor Wembanyama', 'Wembanyama', 'VW', 1, 'SAS', '2020s', ['#000000', '#C4CED4'],
    { scoring: 90, playmaking: 80, defense: 99, athleticism: 95, clutch: 86, leadership: 84 }, 1641705),
  hoops('luka', 'Luka Dončić', 'Dončić', 'LD', 77, 'LAL', '2020s', ['#552583', '#FDB927'],
    { scoring: 96, playmaking: 96, defense: 76, athleticism: 80, clutch: 95, leadership: 90 }, 1629029),
  hoops('giannis', 'Giannis Antetokounmpo', 'Antetokounmpo', 'GA', 34, 'MIL', '2020s', ['#00471B', '#EEE1C6'],
    { scoring: 95, playmaking: 84, defense: 93, athleticism: 99, clutch: 88, leadership: 91 }, 203507),
  hoops('cade', 'Cade Cunningham', 'Cunningham', 'CC', 2, 'DET', '2020s', ['#C8102E', '#1D42BA'],
    { scoring: 90, playmaking: 92, defense: 82, athleticism: 84, clutch: 88, leadership: 88 }, 1630595),
  hoops('ant', 'Anthony Edwards', 'Edwards', 'AE', 5, 'MIN', '2020s', ['#0C2340', '#236192'],
    { scoring: 93, playmaking: 82, defense: 84, athleticism: 96, clutch: 89, leadership: 85 }, 1630162),
  hoops('brunson', 'Jalen Brunson', 'Brunson', 'JB', 11, 'NYK', '2020s', ['#006BB6', '#F58426'],
    { scoring: 91, playmaking: 88, defense: 76, athleticism: 78, clutch: 94, leadership: 90 }, 1628973),
  hoops('tatum', 'Jayson Tatum', 'Tatum', 'JT', 0, 'BOS', '2020s', ['#007A33', '#FFFFFF'],
    { scoring: 93, playmaking: 84, defense: 86, athleticism: 88, clutch: 90, leadership: 88 }, 1628369),
  hoops('mitchell', 'Donovan Mitchell', 'Mitchell', 'DM', 45, 'CLE', '2020s', ['#860038', '#041E42'],
    { scoring: 92, playmaking: 82, defense: 80, athleticism: 90, clutch: 90, leadership: 85 }, 1628378),
  hoops('curry-c', 'Stephen Curry', 'Curry', 'SC', 30, 'GSW', '2010s', ['#1D428A', '#FFC72C'],
    { scoring: 96, playmaking: 90, defense: 76, athleticism: 82, clutch: 97, leadership: 92 }, 201939),
  hoops('durant-c', 'Kevin Durant', 'Durant', 'KD', 7, 'HOU', '2010s', ['#CE1141', '#000000'],
    { scoring: 98, playmaking: 84, defense: 84, athleticism: 88, clutch: 93, leadership: 82 }, 201142),
  hoops('kawhi', 'Kawhi Leonard', 'Leonard', 'KL', 2, 'LAC', '2010s', ['#C8102E', '#1D428A'],
    { scoring: 90, playmaking: 80, defense: 95, athleticism: 86, clutch: 94, leadership: 84 }, 202695),
  hoops('flagg', 'Cooper Flagg', 'Flagg', 'CF', 32, 'DAL', '2020s', ['#00538C', '#002B5E'],
    { scoring: 82, playmaking: 80, defense: 88, athleticism: 88, clutch: 80, leadership: 82 }),
  hoops('avdija', 'Deni Avdija', 'Avdija', 'DA', 8, 'POR', '2020s', ['#E03A3E', '#000000'],
    { scoring: 86, playmaking: 84, defense: 84, athleticism: 85, clutch: 82, leadership: 83 }, 1630166),
  hoops('saraf', 'Ben Saraf', 'Saraf', 'BS', 5, 'BKN', '2020s', ['#000000', '#FFFFFF'],
    { scoring: 78, playmaking: 84, defense: 74, athleticism: 80, clutch: 76, leadership: 78 }),
];

// === BASKETBALL — EUROLEAGUE (legends) ======================================
const EUROLEAGUE_LEGENDS = [
  hoops('saras', 'Šarūnas Jasikevičius', 'Jasikevičius', 'SJ', 11, 'Maccabi / Barça', '2000s', ['#FFD200', '#003DA5'],
    { scoring: 88, playmaking: 95, defense: 80, athleticism: 78, clutch: 97, leadership: 96 }),
  hoops('diamantidis', 'Dimitris Diamantidis', 'Diamantidis', 'DD', 13, 'Panathinaikos', '2000s', ['#006B3F', '#FFFFFF'],
    { scoring: 82, playmaking: 96, defense: 97, athleticism: 84, clutch: 92, leadership: 93 }),
  hoops('papaloukas', 'Theo Papaloukas', 'Papaloukas', 'TP', 7, 'CSKA Moscow', '2000s', ['#D52B1E', '#002B7F'],
    { scoring: 80, playmaking: 97, defense: 84, athleticism: 82, clutch: 90, leadership: 90 }),
  hoops('navarro', 'Juan Carlos Navarro', 'Navarro', 'JN', 11, 'FC Barcelona', '2000s', ['#004D98', '#A50044'],
    { scoring: 95, playmaking: 84, defense: 74, athleticism: 80, clutch: 94, leadership: 88 }),
  hoops('spanoulis', 'Vassilis Spanoulis', 'Spanoulis', 'VS', 7, 'Olympiacos', '2010s', ['#C8102E', '#FFFFFF'],
    { scoring: 90, playmaking: 92, defense: 78, athleticism: 80, clutch: 98, leadership: 92 }),
  hoops('bodiroga', 'Dejan Bodiroga', 'Bodiroga', 'DB', 8, 'Barça / PAO', '2000s', ['#004D98', '#A50044'],
    { scoring: 92, playmaking: 88, defense: 80, athleticism: 82, clutch: 94, leadership: 95 }),
  hoops('vujcic', 'Nikola Vujčić', 'Vujčić', 'NV', 14, 'Maccabi Tel Aviv', '2000s', ['#FFD200', '#003DA5'],
    { scoring: 84, playmaking: 90, defense: 82, athleticism: 76, clutch: 86, leadership: 88 }),
  hoops('parker', 'Anthony Parker', 'Parker', 'AP', 18, 'Maccabi Tel Aviv', '2000s', ['#FFD200', '#003DA5'],
    { scoring: 90, playmaking: 82, defense: 86, athleticism: 88, clutch: 90, leadership: 86 }),
  hoops('sabonis-a', 'Arvydas Sabonis', 'Sabonis', 'AS', 11, 'Žalgiris / Real', '90s', ['#006A44', '#FFFFFF'],
    { scoring: 92, playmaking: 88, defense: 88, athleticism: 80, clutch: 90, leadership: 92 }),
  hoops('siskauskas', 'Ramūnas Šiškauskas', 'Šiškauskas', 'RŠ', 9, 'CSKA Moscow', '2000s', ['#D52B1E', '#002B7F'],
    { scoring: 86, playmaking: 82, defense: 84, athleticism: 84, clutch: 88, leadership: 84 }),
  hoops('brody', 'Tal Brody', 'Brody', 'TB', 10, 'Maccabi Tel Aviv', '70s', ['#FFD200', '#003DA5'],
    { scoring: 88, playmaking: 86, defense: 80, athleticism: 82, clutch: 92, leadership: 97 }),
  hoops('berkowitz', 'Mickey Berkowitz', 'Berkowitz', 'MB', 14, 'Maccabi Tel Aviv', '80s', ['#FFD200', '#003DA5'],
    { scoring: 93, playmaking: 84, defense: 76, athleticism: 84, clutch: 93, leadership: 90 }),
];

// === BASKETBALL — EUROLEAGUE (current, 2025-26) =============================
const EUROLEAGUE_CURRENT = [
  hoops('nunn', 'Kendrick Nunn', 'Nunn', 'KN', 25, 'Panathinaikos', '2020s', ['#006B3F', '#FFFFFF'],
    { scoring: 95, playmaking: 84, defense: 76, athleticism: 86, clutch: 92, leadership: 84 }),
  hoops('mjames', 'Mike James', 'James', 'MJ', 5, 'AS Monaco', '2020s', ['#E2001A', '#FFFFFF'],
    { scoring: 93, playmaking: 92, defense: 74, athleticism: 80, clutch: 94, leadership: 86 }),
  hoops('mirotic', 'Nikola Mirotić', 'Mirotić', 'NM', 33, 'AS Monaco', '2020s', ['#E2001A', '#FFFFFF'],
    { scoring: 94, playmaking: 78, defense: 80, athleticism: 80, clutch: 88, leadership: 86 }),
  hoops('vezenkov', 'Sasha Vezenkov', 'Vezenkov', 'SV', 88, 'Olympiacos', '2020s', ['#C8102E', '#FFFFFF'],
    { scoring: 92, playmaking: 78, defense: 80, athleticism: 80, clutch: 86, leadership: 84 }),
  hoops('walker', 'Lonnie Walker IV', 'Walker', 'LW', 8, 'Maccabi Tel Aviv', '2020s', ['#FFD200', '#003DA5'],
    { scoring: 90, playmaking: 76, defense: 80, athleticism: 92, clutch: 84, leadership: 78 }),
  hoops('blatt', 'Tamir Blatt', 'Blatt', 'TB', 1, 'Maccabi Tel Aviv', '2020s', ['#FFD200', '#003DA5'],
    { scoring: 80, playmaking: 90, defense: 76, athleticism: 76, clutch: 84, leadership: 86 }),
  hoops('campazzo', 'Facundo Campazzo', 'Campazzo', 'FC', 7, 'Real Madrid', '2020s', ['#C7A24A', '#1A1A1A'],
    { scoring: 82, playmaking: 94, defense: 84, athleticism: 78, clutch: 88, leadership: 88 }),
  hoops('tavares', 'Walter Tavares', 'Tavares', 'WT', 22, 'Real Madrid', '2020s', ['#C7A24A', '#1A1A1A'],
    { scoring: 80, playmaking: 70, defense: 96, athleticism: 82, clutch: 82, leadership: 82 }),
  hoops('larkin', 'Shane Larkin', 'Larkin', 'SL', 0, 'Anadolu Efes', '2020s', ['#003DA5', '#FFFFFF'],
    { scoring: 90, playmaking: 88, defense: 78, athleticism: 84, clutch: 88, leadership: 84 }),
  hoops('osman', 'Cedi Osman', 'Osman', 'CO', 16, 'Panathinaikos', '2020s', ['#006B3F', '#FFFFFF'],
    { scoring: 84, playmaking: 80, defense: 78, athleticism: 84, clutch: 84, leadership: 80 }),
];

// === SOCCER — LEGENDS =======================================================
const SOCCER_LEGENDS = [
  soc('pele', 'Pelé', 'Pelé', 'PE', 10, 'Brazil', '1960s', ['#FFDF00', '#009C3B'],
    { pace: 90, shooting: 96, passing: 92, dribbling: 95, defending: 45, physical: 84 }),
  soc('maradona', 'Diego Maradona', 'Maradona', 'DM', 10, 'Argentina', '1980s', ['#75AADB', '#FFFFFF'],
    { pace: 87, shooting: 89, passing: 95, dribbling: 99, defending: 42, physical: 78 }),
  soc('cruyff', 'Johan Cruyff', 'Cruyff', 'JC', 14, 'Netherlands', '1970s', ['#FF6600', '#FFFFFF'],
    { pace: 88, shooting: 88, passing: 95, dribbling: 95, defending: 55, physical: 74 }),
  soc('beckenbauer', 'Franz Beckenbauer', 'Beckenbauer', 'FB', 5, 'Germany', '1970s', ['#1A1A1A', '#FFFFFF'],
    { pace: 78, shooting: 74, passing: 92, dribbling: 84, defending: 96, physical: 86 }),
  soc('zidane', 'Zinedine Zidane', 'Zidane', 'ZZ', 5, 'France', '2000s', ['#0055A4', '#FFFFFF'],
    { pace: 80, shooting: 86, passing: 94, dribbling: 96, defending: 58, physical: 84 }),
  soc('r9', 'Ronaldo Nazário', 'Ronaldo', 'R9', 9, 'Brazil', '2000s', ['#FFDF00', '#009C3B'],
    { pace: 97, shooting: 96, passing: 80, dribbling: 95, defending: 35, physical: 84 }),
  soc('ronaldinho', 'Ronaldinho', 'Ronaldinho', 'R10', 10, 'Brazil', '2000s', ['#FFDF00', '#009C3B'],
    { pace: 86, shooting: 88, passing: 92, dribbling: 98, defending: 40, physical: 78 }),
  soc('diStefano', 'Alfredo Di Stéfano', 'Di Stéfano', 'DS', 9, 'Real Madrid', '1950s', ['#C7A24A', '#1A1A1A'],
    { pace: 84, shooting: 92, passing: 92, dribbling: 88, defending: 70, physical: 86 }),
  soc('maldini', 'Paolo Maldini', 'Maldini', 'PM', 3, 'Italy', '1990s', ['#0066CC', '#FFFFFF'],
    { pace: 84, shooting: 60, passing: 82, dribbling: 80, defending: 96, physical: 88 }),
  soc('platini', 'Michel Platini', 'Platini', 'MP', 10, 'France', '1980s', ['#0055A4', '#FFFFFF'],
    { pace: 78, shooting: 90, passing: 92, dribbling: 86, defending: 55, physical: 78 }),
  soc('baresi', 'Franco Baresi', 'Baresi', 'FB', 6, 'Italy', '1990s', ['#FB090B', '#1A1A1A'],
    { pace: 80, shooting: 58, passing: 84, dribbling: 78, defending: 95, physical: 84 }),
  soc('rcarlos', 'Roberto Carlos', 'R. Carlos', 'RC', 3, 'Brazil', '2000s', ['#FFDF00', '#009C3B'],
    { pace: 95, shooting: 84, passing: 82, dribbling: 84, defending: 84, physical: 86 }),
  soc('messi-l', 'Lionel Messi', 'Messi', 'LM', 10, 'Argentina', '2010s', ['#75AADB', '#FFFFFF'],
    { pace: 84, shooting: 94, passing: 96, dribbling: 99, defending: 38, physical: 68 }),
  soc('cr7-l', 'Cristiano Ronaldo', 'Ronaldo', 'CR', 7, 'Portugal', '2010s', ['#006600', '#FF0000'],
    { pace: 90, shooting: 96, passing: 82, dribbling: 90, defending: 40, physical: 88 }),
];

// === SOCCER — CURRENT (club stars, 2025-26) =================================
const SOCCER_CURRENT = [
  soc('messi', 'Lionel Messi', 'Messi', 'LM', 10, 'Inter Miami', '2020s', ['#F7B5CD', '#231F20'],
    { pace: 78, shooting: 92, passing: 95, dribbling: 97, defending: 36, physical: 64 }),
  soc('mbappe', 'Kylian Mbappé', 'Mbappé', 'KM', 10, 'Real Madrid', '2020s', ['#C7A24A', '#1A1A1A'],
    { pace: 97, shooting: 92, passing: 82, dribbling: 93, defending: 36, physical: 80 }),
  soc('haaland', 'Erling Haaland', 'Haaland', 'EH', 9, 'Manchester City', '2020s', ['#6CABDD', '#FFFFFF'],
    { pace: 89, shooting: 96, passing: 68, dribbling: 80, defending: 40, physical: 93 }),
  soc('bellingham', 'Jude Bellingham', 'Bellingham', 'JB', 5, 'Real Madrid', '2020s', ['#C7A24A', '#1A1A1A'],
    { pace: 84, shooting: 86, passing: 88, dribbling: 88, defending: 74, physical: 86 }),
  soc('vini', 'Vinícius Júnior', 'Vinícius', 'VJ', 7, 'Real Madrid', '2020s', ['#C7A24A', '#1A1A1A'],
    { pace: 96, shooting: 84, passing: 80, dribbling: 94, defending: 34, physical: 76 }),
  soc('yamal', 'Lamine Yamal', 'Yamal', 'LY', 10, 'FC Barcelona', '2020s', ['#A50044', '#004D98'],
    { pace: 89, shooting: 83, passing: 88, dribbling: 94, defending: 38, physical: 66 }),
  soc('pedri', 'Pedri', 'Pedri', 'PG', 8, 'FC Barcelona', '2020s', ['#A50044', '#004D98'],
    { pace: 78, shooting: 78, passing: 93, dribbling: 90, defending: 70, physical: 72 }),
  soc('kane', 'Harry Kane', 'Kane', 'HK', 9, 'Bayern Munich', '2020s', ['#DC052D', '#FFFFFF'],
    { pace: 72, shooting: 95, passing: 86, dribbling: 80, defending: 47, physical: 86 }),
  soc('salah', 'Mohamed Salah', 'Salah', 'MS', 11, 'Liverpool', '2020s', ['#C8102E', '#FFFFFF'],
    { pace: 90, shooting: 90, passing: 82, dribbling: 89, defending: 45, physical: 76 }),
  soc('hakimi', 'Achraf Hakimi', 'Hakimi', 'AH', 2, 'Paris Saint-Germain', '2020s', ['#004170', '#DA291C'],
    { pace: 94, shooting: 76, passing: 82, dribbling: 84, defending: 82, physical: 82 }),
  soc('rodri', 'Rodri', 'Rodri', 'RH', 16, 'Manchester City', '2020s', ['#6CABDD', '#FFFFFF'],
    { pace: 70, shooting: 80, passing: 90, dribbling: 82, defending: 90, physical: 88 }),
  soc('dembele', 'Ousmane Dembélé', 'Dembélé', 'OD', 10, 'Paris Saint-Germain', '2020s', ['#004170', '#DA291C'],
    { pace: 93, shooting: 84, passing: 84, dribbling: 92, defending: 40, physical: 72 }),
  soc('saliba', 'William Saliba', 'Saliba', 'WS', 2, 'Arsenal', '2020s', ['#EF0107', '#FFFFFF'],
    { pace: 86, shooting: 50, passing: 80, dribbling: 78, defending: 90, physical: 88 }),
  soc('cr7', 'Cristiano Ronaldo', 'Ronaldo', 'CR', 7, 'Al-Nassr', '2020s', ['#FFC72C', '#0033A0'],
    { pace: 80, shooting: 92, passing: 78, dribbling: 84, defending: 38, physical: 84 }),
];

// === SOCCER — MONDIAL 2026 (national-team stars) ============================
const SOCCER_MONDIAL_2026 = [
  soc('m-messi', 'Lionel Messi', 'Messi', 'LM', 10, 'Argentina', '2026', ['#75AADB', '#FFFFFF'],
    { pace: 78, shooting: 92, passing: 95, dribbling: 97, defending: 36, physical: 64 }),
  soc('m-mbappe', 'Kylian Mbappé', 'Mbappé', 'KM', 10, 'France', '2026', ['#0055A4', '#EF4135'],
    { pace: 97, shooting: 92, passing: 82, dribbling: 93, defending: 36, physical: 80 }),
  soc('m-haaland', 'Erling Haaland', 'Haaland', 'EH', 9, 'Norway', '2026', ['#BA0C2F', '#00205B'],
    { pace: 89, shooting: 96, passing: 68, dribbling: 80, defending: 40, physical: 93 }),
  soc('m-bellingham', 'Jude Bellingham', 'Bellingham', 'JB', 10, 'England', '2026', ['#FFFFFF', '#CF081F'],
    { pace: 84, shooting: 86, passing: 88, dribbling: 88, defending: 74, physical: 86 }),
  soc('m-vini', 'Vinícius Júnior', 'Vinícius', 'VJ', 7, 'Brazil', '2026', ['#FFDF00', '#009C3B'],
    { pace: 96, shooting: 84, passing: 80, dribbling: 94, defending: 34, physical: 76 }),
  soc('m-yamal', 'Lamine Yamal', 'Yamal', 'LY', 19, 'Spain', '2026', ['#C60B1E', '#FFC400'],
    { pace: 89, shooting: 83, passing: 88, dribbling: 94, defending: 38, physical: 66 }),
  soc('m-pedri', 'Pedri', 'Pedri', 'PG', 9, 'Spain', '2026', ['#C60B1E', '#FFC400'],
    { pace: 78, shooting: 78, passing: 93, dribbling: 90, defending: 70, physical: 72 }),
  soc('m-kane', 'Harry Kane', 'Kane', 'HK', 9, 'England', '2026', ['#FFFFFF', '#CF081F'],
    { pace: 72, shooting: 95, passing: 86, dribbling: 80, defending: 47, physical: 86 }),
  soc('m-salah', 'Mohamed Salah', 'Salah', 'MS', 10, 'Egypt', '2026', ['#CE1126', '#1A1A1A'],
    { pace: 90, shooting: 90, passing: 82, dribbling: 89, defending: 45, physical: 76 }),
  soc('m-alvarez', 'Julián Álvarez', 'Álvarez', 'JA', 9, 'Argentina', '2026', ['#75AADB', '#FFFFFF'],
    { pace: 86, shooting: 88, passing: 82, dribbling: 86, defending: 55, physical: 80 }),
  soc('m-hakimi', 'Achraf Hakimi', 'Hakimi', 'AH', 2, 'Morocco', '2026', ['#C1272D', '#006233'],
    { pace: 94, shooting: 76, passing: 82, dribbling: 84, defending: 82, physical: 82 }),
  soc('m-cr7', 'Cristiano Ronaldo', 'Ronaldo', 'CR', 7, 'Portugal', '2026', ['#006600', '#FF0000'],
    { pace: 80, shooting: 92, passing: 78, dribbling: 84, defending: 38, physical: 84 }),
  soc('m-diaz', 'Luis Díaz', 'Díaz', 'LD', 7, 'Colombia', '2026', ['#FCD116', '#003893'],
    { pace: 92, shooting: 84, passing: 80, dribbling: 90, defending: 48, physical: 76 }),
  soc('m-guler', 'Arda Güler', 'Güler', 'AG', 8, 'Türkiye', '2026', ['#E30A17', '#FFFFFF'],
    { pace: 80, shooting: 84, passing: 90, dribbling: 90, defending: 45, physical: 66 }),
];

// === SOCCER — MONDIAL LEGENDS (World Cup icons) =============================
const SOCCER_MONDIAL_LEGENDS = [
  soc('wl-pele', 'Pelé', 'Pelé', 'PE', 10, 'Brazil', '1970', ['#FFDF00', '#009C3B'],
    { pace: 90, shooting: 96, passing: 92, dribbling: 95, defending: 45, physical: 84 }),
  soc('wl-maradona', 'Diego Maradona', 'Maradona', 'DM', 10, 'Argentina', '1986', ['#75AADB', '#FFFFFF'],
    { pace: 87, shooting: 89, passing: 95, dribbling: 99, defending: 42, physical: 78 }),
  soc('wl-zidane', 'Zinedine Zidane', 'Zidane', 'ZZ', 10, 'France', '1998', ['#0055A4', '#FFFFFF'],
    { pace: 80, shooting: 86, passing: 94, dribbling: 96, defending: 58, physical: 84 }),
  soc('wl-r9', 'Ronaldo Nazário', 'Ronaldo', 'R9', 9, 'Brazil', '2002', ['#FFDF00', '#009C3B'],
    { pace: 97, shooting: 96, passing: 80, dribbling: 95, defending: 35, physical: 84 }),
  soc('wl-beckenbauer', 'Franz Beckenbauer', 'Beckenbauer', 'FB', 5, 'Germany', '1974', ['#1A1A1A', '#FFFFFF'],
    { pace: 78, shooting: 74, passing: 92, dribbling: 84, defending: 96, physical: 86 }),
  soc('wl-muller', 'Gerd Müller', 'Müller', 'GM', 13, 'Germany', '1974', ['#1A1A1A', '#FFFFFF'],
    { pace: 80, shooting: 95, passing: 72, dribbling: 80, defending: 38, physical: 82 }),
  soc('wl-rossi', 'Paolo Rossi', 'Rossi', 'PR', 20, 'Italy', '1982', ['#0066CC', '#FFFFFF'],
    { pace: 84, shooting: 90, passing: 76, dribbling: 82, defending: 40, physical: 76 }),
  soc('wl-cafu', 'Cafu', 'Cafu', 'CF', 2, 'Brazil', '2002', ['#FFDF00', '#009C3B'],
    { pace: 90, shooting: 70, passing: 82, dribbling: 84, defending: 86, physical: 84 }),
  soc('wl-matthaus', 'Lothar Matthäus', 'Matthäus', 'LM', 10, 'Germany', '1990', ['#1A1A1A', '#FFFFFF'],
    { pace: 82, shooting: 86, passing: 88, dribbling: 84, defending: 84, physical: 88 }),
  soc('wl-romario', 'Romário', 'Romário', 'RO', 11, 'Brazil', '1994', ['#FFDF00', '#009C3B'],
    { pace: 88, shooting: 94, passing: 80, dribbling: 92, defending: 32, physical: 72 }),
  soc('wl-fontaine', 'Just Fontaine', 'Fontaine', 'JF', 17, 'France', '1958', ['#0055A4', '#FFFFFF'],
    { pace: 86, shooting: 92, passing: 78, dribbling: 82, defending: 40, physical: 78 }),
  soc('wl-moore', 'Bobby Moore', 'Moore', 'BM', 6, 'England', '1966', ['#FFFFFF', '#CF081F'],
    { pace: 76, shooting: 58, passing: 86, dribbling: 78, defending: 95, physical: 84 }),
];

// --- rosters keyed by mode id ('nba-legends' = the existing players.js list) -
export const ROSTERS = Object.freeze({
  'nba-legends': PLAYERS,
  'nba-current': Object.freeze(NBA_CURRENT),
  'euroleague-legends': Object.freeze(EUROLEAGUE_LEGENDS),
  'euroleague-current': Object.freeze(EUROLEAGUE_CURRENT),
  'soccer-legends': Object.freeze(SOCCER_LEGENDS),
  'soccer-current': Object.freeze(SOCCER_CURRENT),
  'soccer-mondial-2026': Object.freeze(SOCCER_MONDIAL_2026),
  'soccer-mondial-legends': Object.freeze(SOCCER_MONDIAL_LEGENDS),
});

// --- mode registry: sport + category set + display label + live flag ---------
export const MODES = Object.freeze({
  'nba-legends': { sport: 'basketball', icon: '🏀', categories: CATEGORIES, label: 'NBA · Legends', live: false },
  'nba-current': { sport: 'basketball', icon: '🏀', categories: CATEGORIES, label: 'NBA · Current', live: true },
  'euroleague-legends': { sport: 'basketball', icon: '🏀', categories: CATEGORIES, label: 'EuroLeague · Legends', live: false },
  'euroleague-current': { sport: 'basketball', icon: '🏀', categories: CATEGORIES, label: 'EuroLeague · Current', live: true },
  'soccer-legends': { sport: 'soccer', icon: '⚽', categories: SOCCER_CATEGORIES, label: 'Soccer · Legends', live: false },
  'soccer-current': { sport: 'soccer', icon: '⚽', categories: SOCCER_CATEGORIES, label: 'Soccer · Current', live: true },
  'soccer-mondial-2026': { sport: 'soccer', icon: '🌍', categories: SOCCER_CATEGORIES, label: 'Mondial · 2026', live: true },
  'soccer-mondial-legends': { sport: 'soccer', icon: '🌍', categories: SOCCER_CATEGORIES, label: 'Mondial · Legends', live: false },
});

/** Mode ids in display order (used by the mode-select screen). */
export const MODE_IDS = Object.freeze(Object.keys(MODES));

/** The default mode (the original game). */
export const DEFAULT_MODE = 'nba-legends';

/** True if `mode` is a known mode id. */
export function isMode(mode) {
  return Object.prototype.hasOwnProperty.call(MODES, mode);
}

/** The category (skill-slot) array for a mode. */
export function categoriesForMode(mode) {
  return MODES[mode].categories;
}

/** The player roster for a mode. */
export function rosterForMode(mode) {
  return ROSTERS[mode];
}

/** Number of rounds for a mode (one per category). */
export function totalRoundsForMode(mode) {
  return categoriesForMode(mode).length;
}

// Lazily-built id -> player index, per mode (ids are unique within a roster).
const _index = {};
export function playerForMode(mode, id) {
  if (!_index[mode]) {
    _index[mode] = Object.create(null);
    for (const p of rosterForMode(mode)) _index[mode][p.id] = p;
  }
  return _index[mode][id];
}

/** Warm the headshot cache for a mode (only NBA rosters have photo ids). */
export function preloadModeHeadshots(mode) {
  for (const p of rosterForMode(mode)) {
    if (p.nbaId) {
      const img = new Image();
      img.src = headshotUrl(p);
    }
  }
}
