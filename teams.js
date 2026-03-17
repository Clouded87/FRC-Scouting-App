const CSV_URL = 'event_teams.csv';

const teamsStatusElement = document.querySelector('#teams-status');
const teamsMetaElement = document.querySelector('#teams-meta');
const teamsRootElement = document.querySelector('#teams-root');

function setTeamsStatus(message, type = 'info') {
	teamsStatusElement.textContent = message;
	teamsStatusElement.classList.toggle('error', type === 'error');
}

function renderTeamsEmptyState(message) {
	teamsRootElement.innerHTML = `<p class="empty-state">${message}</p>`;
}

function parseCsvLine(line) {
	const cells = [];
	let currentCell = '';
	let inQuotes = false;

	for (let index = 0; index < line.length; index += 1) {
		const character = line[index];
		const nextCharacter = line[index + 1];

		if (character === '"') {
			if (inQuotes && nextCharacter === '"') {
				currentCell += '"';
				index += 1;
			} else {
				inQuotes = !inQuotes;
			}
			continue;
		}

		if (character === ',' && !inQuotes) {
			cells.push(currentCell.trim());
			currentCell = '';
			continue;
		}

		currentCell += character;
	}

	cells.push(currentCell.trim());
	return cells;
}

function parseTeamsCsv(csvText) {
	const lines = csvText
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	if (lines.length <= 1) {
		return [];
	}

	const headerCells = parseCsvLine(lines[0]);
	const teamNumberIndex = headerCells.findIndex((header) => header.toLowerCase() === 'team_number');
	const teamNameIndex = headerCells.findIndex((header) => header.toLowerCase() === 'team_name');
	const cityIndex = headerCells.findIndex((header) => header.toLowerCase() === 'city');
	const stateIndex = headerCells.findIndex((header) => header.toLowerCase() === 'state_prov');

	if (teamNumberIndex < 0) {
		throw new Error('CSV is missing a team_number column.');
	}

	const teams = lines
		.slice(1)
		.map((line) => parseCsvLine(line))
		.map((cells) => {
			const teamNumber = cells[teamNumberIndex] ?? '';
			const parsedNumber = Number.parseInt(teamNumber, 10);

			if (!Number.isInteger(parsedNumber)) {
				return null;
			}

			return {
				teamNumber: parsedNumber,
				teamName: teamNameIndex >= 0 ? (cells[teamNameIndex] ?? '') : '',
				city: cityIndex >= 0 ? (cells[cityIndex] ?? '') : '',
				state: stateIndex >= 0 ? (cells[stateIndex] ?? '') : ''
			};
		})
		.filter((team) => team !== null)
		.sort((left, right) => left.teamNumber - right.teamNumber);

	return teams;
}

function renderTeamsTable(teams) {
	if (teams.length === 0) {
		renderTeamsEmptyState('No teams found in event_teams.csv.');
		return;
	}

	const rows = teams
		.map((team) => {
			const locationParts = [team.city, team.state].filter((value) => value.length > 0);
			const location = locationParts.length > 0 ? locationParts.join(', ') : 'Unknown location';
			const teamName = team.teamName.length > 0 ? team.teamName : 'Unknown team name';

			return `
				<tr>
					<td>${team.teamNumber}</td>
					<td>${teamName}</td>
					<td>${location}</td>
				</tr>
			`;
		})
		.join('');

	teamsRootElement.innerHTML = `
		<table class="teams-table">
			<thead>
				<tr>
					<th scope="col">Team</th>
					<th scope="col">Name</th>
					<th scope="col">Location</th>
				</tr>
			</thead>
			<tbody>${rows}</tbody>
		</table>
	`;
}

async function initializeTeamsPage() {
	setTeamsStatus('Loading teams from CSV...');

	try {
		const response = await fetch(CSV_URL, { cache: 'no-store' });

		if (!response.ok) {
			throw new Error(`CSV request failed with ${response.status}.`);
		}

		const csvText = await response.text();
		const teams = parseTeamsCsv(csvText);

		renderTeamsTable(teams);
		teamsMetaElement.textContent = `${teams.length} teams loaded from ${CSV_URL}`;
		setTeamsStatus(`Loaded ${teams.length} teams.`);
	} catch (error) {
		renderTeamsEmptyState('Unable to load event_teams.csv right now.');
		setTeamsStatus(error instanceof Error ? error.message : 'Unknown CSV loading error.', 'error');
	}
}

initializeTeamsPage();
