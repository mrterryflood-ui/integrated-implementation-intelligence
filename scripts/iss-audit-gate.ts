// Compatible with an already locked local tsx runner. No network-installed npx tools.
// The dependency-isolated implementation also supports plain Node for non-React apps.
void import('../tools/iss-ebeas/gate.mjs')
  .then(({ runCli }) => runCli())
  .catch(() => {
    console.error('ISS-EBEAS: gate could not execute; release is not verified.');
    process.exitCode = 1;
  });
