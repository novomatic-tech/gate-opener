const Hapi = require('hapi');
const Inert = require('inert');
const Path = require('path');
const yamlFormat = require('nconf-yaml');
const nconf = require('nconf/lib/nconf');
const Gpio = require('onoff').Gpio;

async function run() {

    const config = nconf.file({
        file: Path.join(__dirname, 'config/gate-opener.yaml'),
        format: yamlFormat
    }).get();

    const switchOut = new Gpio(config.switch.pin, "high");

    const serverOptions = Object.assign({
        routes: {
            files: {
                relativeTo: Path.join(__dirname, 'static')
            }
        }
    }, config.server);

    const server = Hapi.server(serverOptions);

    await server.register(Inert);

    await server.register({
        plugin: require('yar'),
        options: config.session
    });

    await server.register({
        plugin: require('keycloak-hapi'),
        options: config.keycloak
    });

    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path: '.',
                redirectToSlash: true,
                index: true,
            }
        }
    });

    server.route({
        path: '/api/gate/open',
        method: 'POST',
        handler: async () => {
            switchOut.writeSync(0);
            await sleep(1000);
            switchOut.writeSync(1);
            return {message: 'The gate has been opened.'}
        }
    });

    server.auth.strategy('keycloak', 'keycloak');
    server.auth.default('keycloak');
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
}

run().catch(error => {
    console.error(error);
    process.exit(1);
});

async function sleep(duration) {
    return new Promise((resolve) => setTimeout(() => resolve(), duration));
}
