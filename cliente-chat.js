import WebSocket from 'ws';
import readline from 'readline/promises';
import chalk from 'chalk';

// Dirección del servidor WebSocket
const SERVER_URL = 'ws://localhost:8080';

async function main() {
    const ws = new WebSocket(SERVER_URL);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    let nombreUsuario = null;

    ws.on('open', async () => {
        const bienvenida = chalk.green('Bienvenido al chat. Por favor, ingresa tu nombre de usuario: ');
        nombreUsuario = await rl.question(bienvenida);
        console.log(chalk.green(`Conectado al chat como "${nombreUsuario}".`)); // Mensaje de conexión en verde
        ws.send(nombreUsuario);
        startMessageLoop(ws, rl, nombreUsuario);
    });

    ws.on('message', (mensaje) => {
        const textoMensaje = mensaje.toString();
        if (textoMensaje.startsWith('[Servidor]:')) {
            console.log(chalk.yellowBright(textoMensaje));
        } else {
            console.log(textoMensaje);
        }
    });

    ws.on('close', () => {
        console.log(chalk.red('Conexión cerrada.'));
        rl.close();
        process.exit();
    });

    ws.on('error', (error) => {
        console.error(chalk.red(`Error en la conexión: ${error}`));
        rl.close();
        process.exit(1);
    });
}

async function startMessageLoop(ws, rl, nombreUsuario) {
    while (ws.readyState === WebSocket.OPEN) {
        const mensaje = await rl.question('');
        if (mensaje) {
            ws.send(mensaje);
            console.log(`${nombreUsuario}: ${mensaje}`);
        }
    }
}

main().catch(console.error);