import { SingleKeyDisplay } from './SingleKeyDisplay';
import { SingleKeyLogic } from './SingleKeyLogic';
import { componentDefinition } from '../../registry-utils';

export interface SingleKeyData {
  key: string;
  times: number[];
}

export default componentDefinition({
  type: 'single-key',
  display: SingleKeyDisplay,
  logic: SingleKeyLogic,
});
