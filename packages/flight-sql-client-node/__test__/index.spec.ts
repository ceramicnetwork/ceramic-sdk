import test from 'ava';

import { rustCrateVersion } from '../index';

test('returns native code version', (t) => {
  t.truthy(rustCrateVersion());
});
