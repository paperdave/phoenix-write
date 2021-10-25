// GENERATES FINAL THING
import fajds from 'fs-extra';
import JSON5 from 'json5';

const { readdir, readFile, readJson, writeJsonSync } = fajds;

export const get = async ({}) => {
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

get({}).then((x) => {
	writeJsonSync('build/maps.json', x.body);
});
