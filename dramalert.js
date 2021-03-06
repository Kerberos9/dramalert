const { Telegraf, Scenes, Stage, session } = require('telegraf');
const api_key = process.env.api_key;
const { addAccountScene } = require('./src/addAccountScene');
const { removeAccountScene } = require('./src/removeAccountScene');
const { stalkAccounts } = require('./src/stalkPeople');
const fs = require('fs');
const bot = new Telegraf(api_key);
const stage = new Scenes.Stage([addAccountScene, removeAccountScene]);
const { Client } = require('pg');
const keepAlive = require('./server');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect();

bot.use(session());
bot.use(stage.middleware());
// TODO: Borrar al terminar
bot.command('info', c => {
  c.from.username !== 'Keruberos' ? false : c.reply(c.chat);
});
bot.start(c =>
  c.reply(
    `Bienvenidx a Dramalert, ${
      c.chat.type === 'group' ? c.chat.title : c.from.username
    }!\nEn este bot podrás configurar cuentas de twitter para enterarte cuando alguno de sus tuits tenga más de X interacciones, lo que significa que probablemente la están liando.\nUsa /ayuda si quieres ver los comandos disponibles.`
  )
);
bot.command('vigilar', c => c.scene.enter('addAccountScene'));
bot.command('eliminar', c => c.scene.enter('removeAccountScene'));
bot.command('autor', c => c.reply('@Keruberos'));
bot.command('ayuda', c =>
  c.reply(
    'Comandos disponibles:\n/vigilar - Añadir una cuenta que vigilar por si hay salsa\n/cuentas Ver tus cuentas vigiladas\n/eliminar Eliminar una cuenta vigilada\n/autor Ver el usuario del autor del bot'
  )
);
bot.command('cuentas', c => {
  client.query(`SELECT * FROM accounts WHERE user_id = '${c.chat.id}'`, (err, data) => {
    if (err) {
      console.log(err);
    }
    console.log(`${c.from.username ? c.from.username : c.chat.title} ha comprobado sus cuentas.`);
    if (data && data.rows.length > 0) {
      let response = '';
      data.rows.forEach((a, i) => {
        response += `${i + 1}. @${a.account} -- ${Math.floor(a.number)}\n`;
      });
      c.reply(response);
    } else {
      c.reply('No tienes cuentas vigiladas.');
    }
  });
});
let intervalId = setInterval(() => stalkAccounts(bot), 60000);
keepAlive();
bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  clearInterval(intervalId);
});
