const { WizardScene, Composer, Scenes, Context } = require('telegraf');
const { Pool } = require('pg');
let info = {};
const client = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
const step1 = c => {
  c.reply('Cuál es el @ que debo eliminar?');
  return c.wizard.next();
};
const step2 = async c => {
  if (c.message.text === '/cancelar') {
    return c.scene.leave();
  }
  console.log('Eliminando ' + c.message.text);
  await client.query(
    `SELECT * FROM accounts WHERE user_id = '${c.chat.id}' and account = '${c.message.text}'`,
    (err, data) => {
      console.log(err ? err : 'Sin errores al buscar');
      if (data && data.rows.length > 0) {
        client.query(
          `DELETE FROM accounts WHERE user_id = '${c.chat.id}' and account = '${c.message.text}'`,
          (err, data) => {
            console.log(err ? err : 'Sin errores al eliminar');
            c.reply(`Cuenta @${c.message.text} eliminada.`);
            return c.scene.leave();
          }
        );
      } else {
        c.reply(`Cuenta @${c.message.text} no encontrada.`);
        return c.scene.leave();
      }
    }
  );
};

const removeAccountScene = new Scenes.WizardScene(
  'removeAccountScene',
  c => step1(c),
  c => step2(c)
);

module.exports = { removeAccountScene };
