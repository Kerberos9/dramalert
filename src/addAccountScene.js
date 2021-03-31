const { WizardScene, Composer, Scenes, Context } = require('telegraf');
const diskdb = require('diskdb');
const { Client } = require('pg');
let info = {};
let db;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect();

const step1 = c => {
  db = diskdb.connect('./data', [String(c.chat.id)])[String(c.chat.id)];
  c.reply('Cuál es el @ que debo vigilar?');
  return c.wizard.next();
};

const step2 = c => {
  // TODO: Comprobar si existe en twitter?
  if (c.message.text === '/cancelar') {
    return c.scene.leave();
  }
  let text = c.message.text;
  if (c.message.text[0] === '@') {
    text = c.message.text.substring(1);
  }

  client.query(
    `SELECT * FROM accounts WHERE user_id = ${c.chat.id} and account = ${text}`,
    (err, data) => {
      console.log(data.rows);
      if (data && data.rows.length > 0) {
        c.reply(
          `El usuario @${text} ya está siendo vigilado, con ${results[0].number} interacciones. \nSi quieres cambiar el número, por favor, bórralo antes de añadirlo de nuevo.`
        );
        return c.scene.leave();
      }
    }
  );
  let user = text;
  if (user.length < 2) {
    c.reply('El @ es muy corto, ponlo bien por favor.');
    return;
  }
  info.user = user;
  c.reply('Con cuántas interacciones debería avisarte?');
  return c.wizard.next();
};

const step3 = c => {
  if (c.message.text === '/cancelar') {
    return c.scene.leave();
  }
  let number = parseInt(c.message.text);
  if (!number) {
    c.reply('Número no válido');
    return;
  }
  info.number = number;
  client.query(
    `INSERT INTO accounts VALUES (user_id = ${c.chat.id}, account = ${text})`,
    (err, data) => {
      c.reply(
        `Hecho! Te avisaré cuando el usuario @${info.user} tenga un tuit con ${info.number} o más interacciones.`
      );
      console.log(
        `${c.from.username} añadió la cuenta @${info.user} con ${info.number} interacciones`
      );
      return c.scene.leave();
    }
  );
};

const addAccountScene = new Scenes.WizardScene(
  'addAccountScene',
  c => step1(c),
  c => step2(c),
  c => step3(c)
);

module.exports = { addAccountScene };
