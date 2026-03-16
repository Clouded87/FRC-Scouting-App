const TEAM_NUMBER = 10583;
const SEASON_YEAR = 2026;
const MATCHES_API_URL = `https://api.statbotics.io/v3/matches?team=${TEAM_NUMBER}&year=${SEASON_YEAR}&metric=match_number&ascending=true`;

const statusElement = document.querySelector('#status');
const scheduleMetaElement = document.querySelector('#schedule-meta');
const scheduleRootElement = document.querySelector('#schedule-root');

function setStatus(message, type = 'info') {
	statusElement.textContent = message;
	statusElement.classList.toggle('error', type === 'error');
}

function formatAllianceTeams(teamKeys) {
	if (!Array.isArray(teamKeys) || teamKeys.length === 0) {
		return 'No teams listed';
	}

	return teamKeys.join(', ');
}

function normalizeMatch(match) {
	return {
		key: match.key,
		matchNumber: match.match_number,
		matchLabel: match.match_name || `Match ${match.match_number}`,
		redTeams: match.alliances?.red?.team_keys ?? [],
		blueTeams: match.alliances?.blue?.team_keys ?? []
	};
}

async function fetchMatches() {
	const response = await fetch(MATCHES_API_URL);

	if (!response.ok) {
		throw new Error(`Statbotics request failed with ${response.status}.`);
	}

	return response.json();
}

function renderEmptyState(message) {
	scheduleRootElement.innerHTML = `<p class="empty-state">${message}</p>`;
}

function renderSchedule(matches) {
	if (matches.length === 0) {
		renderEmptyState('No matches were returned for this team and year.');
		return;
	}

	const tableRows = matches.map((match) => `
		<tr>
			<td>
				<span class="match-number">${match.matchNumber}</span>
				<span class="match-label">${match.matchLabel}</span>
			</td>
			<td>
				<span class="alliance-title red">Red</span>
				<p class="teams">${formatAllianceTeams(match.redTeams)}</p>
			</td>
			<td>
				<span class="alliance-title blue">Blue</span>
				<p class="teams">${formatAllianceTeams(match.blueTeams)}</p>
			</td>
		</tr>
	`).join('');

	scheduleRootElement.innerHTML = `
		<table class="schedule-table">
			<thead>
				<tr>
					<th scope="col">Match</th>
					<th scope="col">Red Alliance</th>
					<th scope="col">Blue Alliance</th>
				</tr>
			</thead>
			<tbody>${tableRows}</tbody>
		</table>
	`;
}

async function initializeSchedule() {
	setStatus('Loading matches...');
	scheduleMetaElement.textContent = `Team ${TEAM_NUMBER} | ${SEASON_YEAR} season`;

	try {
		const rawMatches = await fetchMatches();
		const matches = rawMatches.map(normalizeMatch);

		renderSchedule(matches);
		scheduleMetaElement.textContent = `Team ${TEAM_NUMBER} | ${matches.length} matches loaded`;
		setStatus(`Loaded ${matches.length} matches from Statbotics.`);
	} catch (error) {
		renderEmptyState('Unable to load matches right now. Check the API connection and try again.');
		setStatus(error instanceof Error ? error.message : 'Unknown error while loading matches.', 'error');
	}
}

initializeSchedule();

