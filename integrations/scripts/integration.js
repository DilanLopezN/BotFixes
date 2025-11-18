const { exec } = require('child_process');

const integrationName = process.argv.slice(2)?.[0];

if (!integrationName) {
  console.log('Please provide an integration name');
  process.exit(1);
}

const moduleName = `${integrationName}`;

// store the current working directory
const currentLocation = process.cwd();

const commands = [
  `cd ${currentLocation}/src/health/integrations`,
  `nest generate module ${moduleName}`,
  `cd ${currentLocation}/src/health/integrations/${moduleName}`,
  'mkdir services',
  'mkdir interfaces',
  `cd ${currentLocation}/src/health/integrations/${moduleName}/services`,
  `nest generate service ${integrationName} --no-spec --flat`,
  `nest generate service ${integrationName}-api --no-spec --flat`,
  `nest generate service ${integrationName}-helpers --no-spec --flat`,
];

exec(commands.join(' && '), (error, stdout, stderr) => {
  if (error) {
    console.log(`error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.log(`stderr: ${stderr}`);
    return;
  }
  console.log(`success ${stdout}`);
});
