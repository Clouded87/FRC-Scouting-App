const TEAM_NUMBER = 10583;
const SEASON_YEAR = 2026;
const DEFAULT_EVENT_WEEK = 2;

const statusElement = document.querySelector('#status');
const scheduleMetaElement = document.querySelector('#schedule-meta');
const scheduleRootElement = document.querySelector('#schedule-root');
const switchWeekButton = document.querySelector('#switch-week-button');

let currentWeek = DEFAULT_EVENT_WEEK;

function setStatus(message, type = 'info') {
	statusElement.textContent = message;
	statusElement.classList.toggle('error', type === 'error');
}

function formatAllianceTeams(teamKeys) {
	if (!Array.isArray(teamKeys) || teamKeys.length === 0) {
		return 'No teams listed';
	}

	return teamKeys
		.map((teamKey) => {
			const teamLabel = String(teamKey);
			const numericTeam = Number.parseInt(teamLabel.replace(/\D/g, ''), 10);
			const teamClassName = numericTeam === TEAM_NUMBER ? 'team-key team-key-highlight' : 'team-key';

			return `<span class="${teamClassName}">${teamLabel}</span>`;
		})
		.join(', ');
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

async function fetchMatches(selectedWeek) {
	const matchesApiUrl = `https://api.statbotics.io/v3/matches?team=${TEAM_NUMBER}&year=${SEASON_YEAR}&metric=match_number&ascending=true&week=${selectedWeek}`;
	const response = await fetch(matchesApiUrl);

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
	currentWeek = promptForWeek(currentWeek) ?? currentWeek;
	await loadScheduleForWeek(currentWeek);

	switchWeekButton?.addEventListener('click', async () => {
		const selectedWeek = promptForWeek(currentWeek, true);

		if (selectedWeek === null) {
			setStatus(`Kept week ${currentWeek}.`);
			return;
		}

		if (selectedWeek === currentWeek) {
			setStatus(`Already viewing week ${currentWeek}.`);
			return;
		}

		currentWeek = selectedWeek;
		await loadScheduleForWeek(currentWeek);
	});
}

async function loadScheduleForWeek(selectedWeek) {
	setStatus('Loading matches...');
	scheduleMetaElement.textContent = `Team ${TEAM_NUMBER} | ${SEASON_YEAR} season | Week ${selectedWeek}`;

	try {
		const rawMatches = await fetchMatches(selectedWeek);
		const matches = rawMatches.map(normalizeMatch);

		renderSchedule(matches);
		scheduleMetaElement.textContent = `Team ${TEAM_NUMBER} | Week ${selectedWeek} | ${matches.length} matches loaded`;
		setStatus(`Loaded ${matches.length} matches from Statbotics for week ${selectedWeek}.`);
	} catch (error) {
		renderEmptyState('Unable to load matches right now. Check the API connection and try again.');
		setStatus(error instanceof Error ? error.message : 'Unknown error while loading matches.', 'error');
	}
}

function promptForWeek(initialWeek = DEFAULT_EVENT_WEEK, allowCancel = false) {
	const userInput = window.prompt('Enter event week number (1-8):', `${initialWeek}`);

	if (userInput === null) {
		return allowCancel ? null : initialWeek;
	}

	const parsedWeek = Number.parseInt(userInput ?? '', 10);

	if (Number.isInteger(parsedWeek) && parsedWeek >= 1 && parsedWeek <= 8) {
		return parsedWeek;
	}

	return initialWeek;
}

initializeSchedule();

