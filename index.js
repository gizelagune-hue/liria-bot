import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState
} from "@whiskeysockets/baileys";

import { Boom } from "@hapi/boom";

async function iniciarBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    // Gerar Pairing Code
    if (connection === "connecting" && !state.creds.registered) {
      const numero = "258XXXXXXXXX"; // coloca o número aqui

      const codigo = await sock.requestPairingCode(numero);

      console.log("================================");
      console.log("🔑 CÓDIGO DA LÍRIA BOT:");
      console.log(codigo);
      console.log("================================");
    }

    if (connection === "open") {
      console.log("🤖 Líria Bot conectada!");
    }

    if (connection === "close") {
      const motivo =
        new Boom(lastDisconnect?.error)?.output?.statusCode;

      if (motivo !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconectando...");
        iniciarBot();
      } else {
        console.log("❌ Sessão encerrada.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const texto =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (texto.toLowerCase() === "ping") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "🏓 Pong!\n🤖 Líria Bot está online!"
      });
    }
  });
}

iniciarBot();
