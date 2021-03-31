const { WizardScene, Composer, Scenes, Context } = require('telegraf');
const diskdb = require('diskdb');

let info = {};
let db;

const step1 = c => {
  c.reply('Cuál es el @ que debo eliminar?');
  return c.wizard.next();
};
const step2 = c => {
  if (c.message.text === '/cancelar') {
    return c.scene.leave();
  }
  db = diskdb.connect('./data', [String(c.chat.id)])[String(c.chat.id)];
  let results = db.find({ user: c.message.text });
  if (results.length > 0) {
    db.remove({ user: c.message.text });
    c.reply(`Cuenta @${c.message.text} eliminada.`);
    return c.scene.leave();
  } else {
    c.reply(`Cuenta @${c.message.text} no encontrada.`);
  }
  return c.scene.leave();
};

const removeAccountScene = new Scenes.WizardScene(
  'removeAccountScene',
  c => step1(c),
  c => step2(c)
);

module.exports = { removeAccountScene };
