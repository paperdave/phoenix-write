import type { RequestHandler } from '@sveltejs/kit';
import { readdir, readJson } from 'fs-extra';

export const get: RequestHandler = async ({}) => {
	const maps = await readdir('static/maps');

	const allData = await Promise.all(
		maps.map(async (mapName) => {
			const meta = await readJson('static/maps/' + mapName + '/meta.json');
			return [mapName, meta];
		})
	);

	return {
		body: {
			maps: Object.fromEntries(allData),
			order: maps
		}
	};
};
