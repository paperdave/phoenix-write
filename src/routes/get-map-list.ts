import type { RequestHandler } from '@sveltejs/kit';
import { readdir, readFile, readJson } from 'fs-extra';
import JSON5 from 'json5';

export const get: RequestHandler = async ({}) => {
	const maps = await readdir('static/maps');

	const allData = (
		await Promise.all(
			maps.map(async (mapName) => {
				const meta = await readFile('static/maps/' + mapName + '/meta.json');
				const parsed = JSON5.parse(meta.toString());
				return [mapName, parsed];
			})
		)
	).filter(([, meta]) => !meta.disabled);

	return {
		body: {
			maps: Object.fromEntries(allData)
		}
	};
};
