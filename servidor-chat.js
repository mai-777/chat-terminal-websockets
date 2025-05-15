import { WebSocketServer } from 'ws';
import readline from 'readline/promises';
import chalk from 'chalk';

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });
const clientes = new Map();
const colores = [
    chalk.blue,
    chalk.magenta,
    chalk.cyan,
    chalk.magentaBright,
    chalk.cyanBright,
    chalk.whiteBright,
    chalk.gray,
    chalk.blueBright
];
let colorIndex = 0;

console.log(chalk.green(`Servidor WebSocket escuchando en el puerto ${PORT}`));

wss.on('connection', (ws) => {
    const clienteColor = colores[colorIndex % colores.length];
    colorIndex++;
    console.log(clienteColor('Cliente conectado'));

    ws.on('message', (mensaje) => {
        const mensajeTexto = mensaje.toString();

        if (!clientes.has(ws)) {
            const nombreUsuario = mensajeTexto.trim();
            if (nombreUsuario) {
                clientes.set(ws, { nombreUsuario, color: clienteColor }); // Almacenar el color del cliente
                console.log(clienteColor(`Usuario "${nombreUsuario}" se ha unido al chat.`));
                servidorBroadcast(chalk.yellowBright(`[Servidor]: El usuario "${nombreUsuario}" se ha unido al chat.`));
            } else {
                ws.send('Por favor, ingresa un nombre de usuario válido:');
            }
            return;
        }

        const remitenteInfo = clientes.get(ws);
        if (remitenteInfo?.nombreUsuario) {
            const mensajeConColor = remitenteInfo.color(`${remitenteInfo.nombreUsuario}: ${mensajeTexto}`);
            console.log(mensajeConColor);
            broadcast(mensajeConColor, ws);
        }
    });

    ws.on('close', () => {
        const nombreUsuario = clientes.get(ws)?.nombreUsuario;
        const clienteColor = clientes.get(ws)?.color;
        clientes.delete(ws);
        if (nombreUsuario && clienteColor) {
            console.log(clienteColor(`Usuario "${nombreUsuario}" ha salido del chat.`));
            broadcast(chalk.yellowBright(`[Servidor]: El usuario "${nombreUsuario}" ha salido del chat.`));
        }
    });

    ws.on('error', (error) => {
        const clienteColor = clientes.get(ws)?.color || chalk.redBright;
        console.error(clienteColor(`Error en la conexión: ${error}`));
        clientes.delete(ws);
    });
});

function broadcast(mensaje, remitente) {
    clientes.forEach((clienteInfo, clienteSocket) => {
        if (clienteSocket !== remitente && clienteSocket.readyState === 1) {
            clienteSocket.send(mensaje);
        }
    });
}

async function servidorInput() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    while (true) {
        const comando = await rl.question('');
        if (comando.trim()) {
            servidorBroadcast(chalk.yellowBright(`[Servidor]: ${comando.trim()}`));
        }
    }
}

function servidorBroadcast(mensaje) {
    clientes.forEach((clienteInfo, clienteSocket) => {
        if (clienteSocket.readyState === 1) {
            clienteSocket.send(mensaje);
        }
    });
}

servidorInput().catch(console.error);