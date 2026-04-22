// Global Variables
let playersDatabase = [];
let starterTeams = [];
let gameState = {
    selectedTeam: null,
    budget: 50,
    points: 0,
    ranking: 20,
    matchesPlayed: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    squad: [],
    formation: "442",
    leagueTable: []
};

// Load JSON Data
async function loadGameData() {
    try {
        // Load players
        const playersResponse = await fetch('players.json');
        const playersData = await playersResponse.json();
        playersDatabase = playersData.players;

        // Load teams
        const teamsResponse = await fetch('teams.json');
        const teamsData = await teamsResponse.json();
        starterTeams = teamsData.starterTeams;

        console.log('✅ Data loaded successfully!');
        console.log(`Players: ${playersDatabase.length}`);
        console.log(`Teams: ${starterTeams.length}`);

        // Initialize game after data is loaded
        initializeGame();
    } catch (error) {
        console.error('❌ Error loading data:', error);
        alert('Lỗi tải dữ liệu! Vui lòng kiểm tra file JSON.');
    }
}

// Initialize Game
function initializeGame() {
    renderTeamSelection();
    startIntro();
}

// Intro Animation
const introTexts = [
    "Xin chào tân huấn luyện viên...",
    "Chào mừng ngài đến với thế giới Virtual Football Association",
    "Xin mời ngài chọn đội bóng"
];

let currentTextIndex = 0;

function startIntro() {
    const introTextElement = document.getElementById('intro-text');
    const introScreen = document.getElementById('intro-screen');

    function showNextIntroText() {
        if (currentTextIndex < introTexts.length) {
            introTextElement.style.opacity = '0';
            setTimeout(() => {
                introTextElement.textContent = introTexts[currentTextIndex];
                introTextElement.style.opacity = '1';
                currentTextIndex++;
                setTimeout(showNextIntroText, 3000);
            }, 500);
        } else {
            setTimeout(() => {
                introScreen.classList.add('fade-out');
                setTimeout(() => {
                    document.getElementById('team-selection').classList.add('active');
                }, 1000);
            }, 1000);
        }
    }

    setTimeout(showNextIntroText, 500);
}

// Render Team Selection
function renderTeamSelection() {
    const grid = document.getElementById('teams-grid');
    if (starterTeams.length === 0) {
        grid.innerHTML = '<div class="loading">Đang tải dữ liệu...</div>';
        return;
    }

    grid.innerHTML = starterTeams.map(team => `
        <div class="team-card" onclick="selectTeam(${team.id})">
            <h2>${team.name}</h2>
            <div class="league">${team.league} - ${team.country}</div>
            <div class="stats">
                <div class="stat-item">💰 Ngân sách: €${team.budget}M</div>
                <div class="stat-item">🏟️ ${team.stadium}</div>
                <div class="stat-item">📅 Thành lập: ${team.founded}</div>
                <div class="stat-item">👥 Sức chứa: ${team.capacity.toLocaleString()}</div>
            </div>
        </div>
    `).join('');
}

// Select Team
function selectTeam(teamId) {
    const team = starterTeams.find(t => t.id === teamId);
    if (!team) {
        alert('Không tìm thấy đội bóng!');
        return;
    }

    gameState.selectedTeam = team;
    gameState.budget = team.budget;
    
    // Generate starter squad
    generateStarterSquad(team.league);
    
    // Initialize league table
    initializeLeagueTable(team.league);
    
    // Show game screen
    document.getElementById('team-selection').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    
    // Update UI
    updateGameUI();
}

// Generate Starter Squad
function generateStarterSquad(league) {
    const freeAgents = playersDatabase.filter(p => p.league === league && p.price < 30);
    
    const positions = {
        'GK': 2,
        'DEF': 6,
        'MID': 6,
        'ATT': 4
    };
    
    gameState.squad = [];
    
    for (let pos in positions) {
        const count = positions[pos];
        const posPlayers = freeAgents.filter(p => p.position === pos);
        
        // Shuffle to get random players
        const shuffled = posPlayers.sort(() => 0.5 - Math.random());
        
        for (let i = 0; i < count && i < shuffled.length; i++) {
            const player = {...shuffled[i]};
            // Reduce stats for starter players
            player.pace = Math.max(50, player.pace - 15);
            player.shot = Math.max(50, player.shot - 15);
            player.pass = Math.max(50, player.pass - 15);
            player.physical = Math.max(50, player.physical - 10);
            player.defend = Math.max(50, player.defend - 15);
            player.goalkeeping = Math.max(50, player.goalkeeping - 10);
            player.price = Math.max(3, player.price - 20);
            player.inSquad = true;
            gameState.squad.push(player);
        }
    }

    // If not enough players, add generic ones
    const needed = {
        'GK': 2 - gameState.squad.filter(p => p.position === 'GK').length,
        'DEF': 6 - gameState.squad.filter(p => p.position === 'DEF').length,
        'MID': 6 - gameState.squad.filter(p => p.position === 'MID').length,
        'ATT': 4 - gameState.squad.filter(p => p.position === 'ATT').length
    };

    for (let pos in needed) {
        for (let i = 0; i < needed[pos]; i++) {
            gameState.squad.push(createGenericPlayer(pos, league));
        }
    }
}

// Create Generic Player
function createGenericPlayer(position, league) {
    const nationalities = ['England', 'Spain', 'Italy', 'Germany', 'France', 'Brazil', 'Argentina'];
    const firstNames = ['John', 'Marco', 'Luis', 'Pierre', 'Hans', 'Carlos', 'Alex'];
    const lastNames = ['Smith', 'Garcia', 'Rossi', 'Müller', 'Dubois', 'Silva', 'Martinez'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return {
        id: Date.now() + Math.random(),
        name: `${firstName} ${lastName}`,
        position: position,
        age: 20 + Math.floor(Math.random() * 10),
        nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
        league: league,
        team: 'Free Agent',
        pace: 50 + Math.floor(Math.random() * 20),
        shot: 50 + Math.floor(Math.random() * 20),
        pass: 50 + Math.floor(Math.random() * 20),
        physical: 50 + Math.floor(Math.random() * 20),
        defend: 50 + Math.floor(Math.random() * 20),
        goalkeeping: position === 'GK' ? 50 + Math.floor(Math.random() * 20) : 10,
        price: 5 + Math.floor(Math.random() * 10),
        inSquad: true
    };
}

// Update Game UI
function updateGameUI() {
    document.getElementById('current-team-name').textContent = gameState.selectedTeam.name;
    document.getElementById('current-league').textContent = gameState.selectedTeam.league;
    document.getElementById('budget').textContent = `€${gameState.budget}M`;
    document.getElementById('points').textContent = gameState.points;
    document.getElementById('ranking').textContent = gameState.ranking;
    
    renderSquad();
    renderFormation();
    renderTransferMarket();
    renderLeagueTable();
}

// Calculate Overall Rating
function calculateOverall(player) {
    if (player.position === 'GK') {
        return Math.round((player.goalkeeping * 0.6 + player.physical * 0.2 + player.pace * 0.1 + player.pass * 0.1));
    } else if (player.position === 'DEF') {
        return Math.round((player.defend * 0.5 + player.physical * 0.25 + player.pace * 0.15 + player.pass * 0.1));
    } else if (player.position === 'MID') {
        return Math.round((player.pass * 0.35 + player.pace * 0.2 + player.shot * 0.2 + player.physical * 0.15 + player.defend * 0.1));
    } else { // ATT
        return Math.round((player.shot * 0.4 + player.pace * 0.3 + player.pass * 0.2 + player.physical * 0.1));
    }
}

// Create Stat Bar
function createStatBar(value) {
    const color = value >= 80 ? '#4CAF50' : value >= 70 ? '#FFC107' : value >= 60 ? '#FF9800' : '#FF5722';
    return `
        <div class="stat-bar">
            <div class="stat-bar-fill" style="width: ${value}%; background: ${color};"></div>
            <span class="stat-value">${value}</span>
        </div>
    `;
}

// Render Squad
function renderSquad() {
    const tbody = document.getElementById('squad-body');
    
    if (gameState.squad.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" style="text-align: center;">Chưa có cầu thủ nào</td></tr>';
        return;
    }

    tbody.innerHTML = gameState.squad.map(player => {
        const overall = calculateOverall(player);
        return `
            <tr>
                <td><strong>${player.name}</strong></td>
                <td><span class="position-badge pos-${player.position}">${player.position}</span></td>
                <td>${player.age}</td>
                <td>${player.nationality}</td>
                <td><strong style="color: #4CAF50;">${overall}</strong></td>
                <td>${createStatBar(player.pace)}</td>
                <td>${createStatBar(player.shot)}</td>
                <td>${createStatBar(player.pass)}</td>
                <td>${createStatBar(player.physical)}</td>
                <td>${createStatBar(player.defend)}</td>
                <td>${createStatBar(player.goalkeeping)}</td>
                <td>
                    <button class="btn btn-danger" onclick="sellPlayer(${player.id})">Bán €${Math.round(player.price * 0.7)}M</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Sell Player
function sellPlayer(playerId) {
    const playerIndex = gameState.squad.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
        const player = gameState.squad[playerIndex];
        const sellPrice = Math.round(player.price * 0.7);
        
        if (confirm(`Bạn có chắc muốn bán ${player.name} với giá €${sellPrice}M?`)) {
            gameState.budget += sellPrice;
            gameState.squad.splice(playerIndex, 1);
            alert(`✅ Đã bán ${player.name} với giá €${sellPrice}M`);
            updateGameUI();
        }
    }
}

// Formation Positions
const formations = {
    '442': [
        {pos: 'GK', x: 50, y: 90},
        {pos: 'DEF', x: 20, y: 70}, {pos: 'DEF', x: 40, y: 75}, {pos: 'DEF', x: 60, y: 75}, {pos: 'DEF', x: 80, y: 70},
        {pos: 'MID', x: 20, y: 45}, {pos: 'MID', x: 40, y: 40}, {pos: 'MID', x: 60, y: 40}, {pos: 'MID', x: 80, y: 45},
        {pos: 'ATT', x: 35, y: 15}, {pos: 'ATT', x: 65, y: 15}
    ],
    '433': [
        {pos: 'GK', x: 50, y: 90},
        {pos: 'DEF', x: 20, y: 70}, {pos: 'DEF', x: 40, y: 75}, {pos: 'DEF', x: 60, y: 75}, {pos: 'DEF', x: 80, y: 70},
        {pos: 'MID', x: 30, y: 50}, {pos: 'MID', x: 50, y: 45}, {pos: 'MID', x: 70, y: 50},
        {pos: 'ATT', x: 20, y: 15}, {pos: 'ATT', x: 50, y: 10}, {pos: 'ATT', x: 80, y: 15}
    ],
    '352': [
        {pos: 'GK', x: 50, y: 90},
        {pos: 'DEF', x: 25, y: 70}, {pos: 'DEF', x: 50, y: 75}, {pos: 'DEF', x: 75, y: 70},
        {pos: 'MID', x: 15, y: 50}, {pos: 'MID', x: 35, y: 45}, {pos: 'MID', x: 50, y: 40}, {pos: 'MID', x: 65, y: 45}, {pos: 'MID', x: 85, y: 50},
        {pos: 'ATT', x: 35, y: 15}, {pos: 'ATT', x: 65, y: 15}
    ],
    '4231': [
        {pos: 'GK', x: 50, y: 90},
        {pos: 'DEF', x: 20, y: 70}, {pos: 'DEF', x: 40, y: 75}, {pos: 'DEF', x: 60, y: 75}, {pos: 'DEF', x: 80, y: 70},
        {pos: 'MID', x: 35, y: 55}, {pos: 'MID', x: 65, y: 55},
        {pos: 'MID', x: 20, y: 30}, {pos: 'MID', x: 50, y: 25}, {pos: 'MID', x: 80, y: 30},
        {pos: 'ATT', x: 50, y: 10}
    ]
};

// Render Formation
function renderFormation() {
    const field = document.getElementById('formation-field');
    const formation = formations[gameState.formation];
    
    field.innerHTML = '';
    
    const positionCounts = {};
    formation.forEach(spot => {
        positionCounts[spot.pos] = (positionCounts[spot.pos] || 0) + 1;
    });
    
    const positionIndices = {};
    
    formation.forEach(spot => {
        const posIndex = positionIndices[spot.pos] || 0;
        positionIndices[spot.pos] = posIndex + 1;
        
        const playersInPos = gameState.squad.filter(p => p.position === spot.pos);
        const player = playersInPos[posIndex] || {name: '?', position: spot.pos};
        
        const dot = document.createElement('div');
        dot.className = 'player-dot';
        dot.style.left = `${spot.x}%`;
        dot.style.top = `${spot.y}%`;
        dot.style.transform = 'translate(-50%, -50%)';
        
        if (player.name === '?') {
            dot.innerHTML = `<div>${spot.pos}</div>`;
            dot.style.background = '#999';
        } else {
            const lastName = player.name.split(' ').pop();
            dot.innerHTML = `<div>${lastName}</div>`;
            dot.title = `${player.name} (${calculateOverall(player)})`;
        }
        
        field.appendChild(dot);
    });
}

// Change Formation
function changeFormation() {
    gameState.formation = document.getElementById('formation-select').value;
    renderFormation();
}

// Render Transfer Market
function renderTransferMarket() {
    const container = document.getElementById('transfer-market');
    const availablePlayers = playersDatabase.filter(p => 
        !gameState.squad.find(sp => sp.id === p.id)
    );
    
    if (availablePlayers.length === 0) {
        container.innerHTML = '<div class="loading">Không có cầu thủ nào</div>';
        return;
    }

    container.innerHTML = availablePlayers.slice(0, 30).map(player => `
        <div class="player-card">
            <div class="player-info">
                <div class="player-name">${player.name}</div>
                <div style="color: #aaa; margin-bottom: 10px;">
                    <span class="position-badge pos-${player.position}">${player.position}</span>
                    ${player.age} tuổi | ${player.nationality} | ${player.team}
                </div>
                <div class="player-stats-grid">
                    <div><strong>PAC:</strong> ${player.pace}</div>
                    <div><strong>SHO:</strong> ${player.shot}</div>
                    <div><strong>PAS:</strong> ${player.pass}</div>
                    <div><strong>PHY:</strong> ${player.physical}</div>
                    <div><strong>DEF:</strong> ${player.defend}</div>
                    <div><strong>GK:</strong> ${player.goalkeeping}</div>
                </div>
                <div style="margin-top: 10px;">
                    <strong>Overall: ${calculateOverall(player)}</strong>
                </div>
                <div style="margin-top: 10px; font-size: 18px; color: #FFD700;">
                    💰 €${player.price}M
                </div>
            </div>
            <button class="btn btn-primary" onclick="buyPlayer(${player.id})">
                Mua
            </button>
        </div>
    `).join('');
}

// Filter Transfer Market
function filterTransferMarket() {
    const league = document.getElementById('filter-league').value;
    const position = document.getElementById('filter-position').value;
    const name = document.getElementById('filter-name').value.toLowerCase();
    
    const container = document.getElementById('transfer-market');
    let availablePlayers = playersDatabase.filter(p => 
        !gameState.squad.find(sp => sp.id === p.id)
    );
    
    if (league) {
        availablePlayers = availablePlayers.filter(p => p.league === league);
    }
    if (position) {
        availablePlayers = availablePlayers.filter(p => p.position === position);
    }
    if (name) {
        availablePlayers = availablePlayers.filter(p => p.name.toLowerCase().includes(name));
    }
    
    container.innerHTML = availablePlayers.slice(0, 30).map(player => `
        <div class="player-card">
            <div class="player-info">
                <div class="player-name">${player.name}</div>
                <div style="color: #aaa; margin-bottom: 10px;">
                    <span class="position-badge pos-${player.position}">${player.position}</span>
                    ${player.age} tuổi | ${player.nationality} | ${player.team}
                </div>
                <div class="player-stats-grid">
                    <div><strong>PAC:</strong> ${player.pace}</div>
                    <div><strong>SHO:</strong> ${player.shot}</div>
                    <div><strong>PAS:</strong> ${player.pass}</div>
                    <div><strong>PHY:</strong> ${player.physical}</div>
                    <div><strong>DEF:</strong> ${player.defend}</div>
                    <div><strong>GK:</strong> ${player.goalkeeping}</div>
                </div>
                <div style="margin-top: 10px;">
                    <strong>Overall: ${calculateOverall(player)}</strong>
                </div>
                <div style="margin-top: 10px; font-size: 18px; color: #FFD700;">
                    💰 €${player.price}M
                </div>
            </div>
            <button class="btn btn-primary" onclick="buyPlayer(${player.id})">
                Mua
            </button>
        </div>
    `).join('');
}

// Buy Player
function buyPlayer(playerId) {
    const player = playersDatabase.find(p => p.id === playerId);
    
    if (!player) {
        alert('❌ Không tìm thấy cầu thủ!');
        return;
    }

    if (gameState.budget >= player.price) {
        if (confirm(`Bạn có chắc muốn mua ${player.name} với giá €${player.price}M?`)) {
            gameState.squad.push({...player, inSquad: true});
            gameState.budget -= player.price;
            alert(`✅ Đã mua ${player.name} với giá €${player.price}M`);
            updateGameUI();
        }
    } else {
        alert(`❌ Không đủ ngân sách! Cần €${player.price}M nhưng chỉ có €${gameState.budget}M`);
    }
}

// Match Simulation
function simulateMatch() {
    const opponents = [
        'Manchester United', 'Liverpool', 'Chelsea', 'Arsenal', 'Tottenham',
        'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla',
        'Inter Milan', 'AC Milan', 'Juventus', 'Napoli',
        'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig',
        'PSG', 'Marseille', 'Monaco', 'Lyon',
        'Galatasaray', 'Fenerbahce', 'Besiktas'
    ];
    
    const opponent = opponents[Math.floor(Math.random() * opponents.length)];
    document.getElementById('home-team').textContent = gameState.selectedTeam.name;
    document.getElementById('away-team').textContent = opponent;
    
    // Calculate team strength
    const myStrength = gameState.squad.reduce((sum, p) => sum + calculateOverall(p), 0) / gameState.squad.length;
    const oppStrength = 60 + Math.random() * 25;
    
    // Simulate score
    let myGoals = 0;
    let oppGoals = 0;
    
    const myChance = myStrength / (myStrength + oppStrength);
    
    for (let i = 0; i < 20; i++) {
        if (Math.random() < myChance * 0.15) myGoals++;
        if (Math.random() < (1 - myChance) * 0.15) oppGoals++;
    }
    
    // Update stats
    gameState.matchesPlayed++;
    if (myGoals > oppGoals) {
        gameState.wins++;
        gameState.points += 3;
    } else if (myGoals === oppGoals) {
        gameState.draws++;
        gameState.points += 1;
    } else {
        gameState.losses++;
    }
    
    // Update ranking
    gameState.ranking = Math.max(1, 20 - Math.floor(gameState.points / 3));
    
    // Show result
    document.getElementById('match-score').textContent = `${myGoals} - ${oppGoals}`;
    document.getElementById('match-result').style.display = 'block';
    
    // Generate events
    const events = [];
    const attackers = gameState.squad.filter(p => p.position === 'ATT' || p.position === 'MID');
    
    for (let i = 0; i < myGoals; i++) {
        const minute = Math.floor(Math.random() * 90) + 1;
        const scorer = attackers[Math.floor(Math.random() * attackers.length)] || {name: 'Unknown'};
        events.push({minute, text: `⚽ BÀN THẮNG! ${scorer.name} ghi bàn cho ${gameState.selectedTeam.name}`, type: 'goal'});
    }
    
    for (let i = 0; i < oppGoals; i++) {
        const minute = Math.floor(Math.random() * 90) + 1;
        events.push({minute, text: `⚽ ${opponent} ghi bàn`, type: 'goal'});
    }
    
    // Add some random events
    for (let i = 0; i < 3; i++) {
        const minute = Math.floor(Math.random() * 90) + 1;
        const eventTypes = [
            '🟨 Thẻ vàng',
            '🚑 Cầu thủ bị thương',
            '🔄 Thay người',
            '📊 Phạt góc'
        ];
        const eventText = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        events.push({minute, text: eventText, type: 'normal'});
    }
    
    events.sort((a, b) => a.minute - b.minute);
    
    document.getElementById('match-events').innerHTML = events.map(e => `
        <div class="match-event ${e.type}">
            <strong>${e.minute}'</strong> - ${e.text}
        </div>
    `).join('');
    
    // Update league table with match result
    updateLeagueTableAfterMatch(myGoals, oppGoals);
    
    updateGameUI();
}

// Initialize League Table
function initializeLeagueTable(league) {
    const leagueTeams = {
        'Premier League': ['Manchester City', 'Liverpool', 'Arsenal', 'Chelsea', 'Manchester United', 'Tottenham', 'Newcastle', 'Brighton', 'Aston Villa', 'West Ham', 'Crystal Palace', 'Fulham', 'Wolves', 'Everton', 'Brentford', 'Nottingham Forest', 'Bournemouth', 'Luton', 'Sheffield United'],
        'La Liga': ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla', 'Real Betis', 'Villarreal', 'Real Sociedad', 'Athletic Bilbao', 'Valencia', 'Celta Vigo', 'Osasuna', 'Getafe', 'Rayo Vallecano', 'Mallorca', 'Las Palmas', 'Cadiz', 'Almeria', 'Granada', 'Alaves'],
        'Serie A': ['Inter Milan', 'AC Milan', 'Juventus', 'Napoli', 'Roma', 'Lazio', 'Atalanta', 'Fiorentina', 'Bologna', 'Torino', 'Udinese', 'Monza', 'Genoa', 'Lecce', 'Verona', 'Cagliari', 'Empoli', 'Frosinone', 'Salernitana'],
        'Bundesliga': ['Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen', 'Union Berlin', 'Freiburg', 'Eintracht Frankfurt', 'Wolfsburg', 'Monchengladbach', 'Stuttgart', 'Hoffenheim', 'Mainz', 'Werder Bremen', 'Augsburg', 'Heidenheim', 'Bochum', 'Darmstadt', 'Koln'],
        'Ligue 1': ['PSG', 'Marseille', 'Monaco', 'Lyon', 'Lille', 'Rennes', 'Nice', 'Lens', 'Strasbourg', 'Nantes', 'Reims', 'Toulouse', 'Montpellier', 'Brest', 'Le Havre', 'Lorient', 'Metz', 'Clermont'],
        'Turkish Super Lig': ['Galatasaray', 'Fenerbahce', 'Besiktas', 'Trabzonspor', 'Basaksehir', 'Antalyaspor', 'Konyaspor', 'Alanyaspor', 'Gaziantep', 'Kasimpasa', 'Sivasspor', 'Hatayspor', 'Adana Demirspor', 'Kayserispor', 'Rizespor', 'Pendikspor', 'Fatih Karagumruk', 'Istanbulspor']
    };
    
    const selectedTeams = leagueTeams[league] || leagueTeams['Premier League'];
    
    gameState.leagueTable = [
        {name: gameState.selectedTeam.name, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0},
        ...selectedTeams.slice(0, 19).map(team => {
            const played = Math.floor(Math.random() * 5);
            const wins = Math.floor(Math.random() * (played + 1));
            const losses = Math.floor(Math.random() * (played - wins + 1));
            const draws = played - wins - losses;
            const gf = wins * 2 + draws + Math.floor(Math.random() * 5);
            const ga = losses * 2 + draws + Math.floor(Math.random() * 5);
            
            return {
                name: team,
                played: played,
                wins: wins,
                draws: draws,
                losses: losses,
                gf: gf,
                ga: ga,
                gd: gf - ga,
                points: wins * 3 + draws
            };
        })
    ];
    
    gameState.leagueTable.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
    });
}

// Update League Table After Match
function updateLeagueTableAfterMatch(myGoals, oppGoals) {
    const yourTeam = gameState.leagueTable.find(t => t.name === gameState.selectedTeam.name);
    if (yourTeam) {
        yourTeam.played = gameState.matchesPlayed;
        yourTeam.wins = gameState.wins;
        yourTeam.draws = gameState.draws;
        yourTeam.losses = gameState.losses;
        yourTeam.gf += myGoals;
        yourTeam.ga += oppGoals;
        yourTeam.gd = yourTeam.gf - yourTeam.ga;
        yourTeam.points = gameState.points;
    }
}

// Render League Table
function renderLeagueTable() {
    const tbody = document.getElementById('league-table');
    
    gameState.leagueTable.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
    });
    
    tbody.innerHTML = gameState.leagueTable.map((team, index) => `
        <tr style="${team.name === gameState.selectedTeam.name ? 'background: rgba(76, 175, 80, 0.2); font-weight: bold;' : ''}">
            <td>${index + 1}</td>
            <td>${team.name}</td>
            <td>${team.played}</td>
            <td>${team.wins}</td>
            <td>${team.draws}</td>
            <td>${team.losses}</td>
            <td style="color: ${team.gd >= 0 ? '#4CAF50' : '#F44336'}">${team.gd >= 0 ? '+' : ''}${team.gd}</td>
            <td><strong style="color: #FFD700;">${team.points}</strong></td>
        </tr>
    `).join('');
}

// Tab Switching
function switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    loadGameData();
});