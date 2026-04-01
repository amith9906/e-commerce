'use strict';
require('dotenv').config();

const { runCartRecovery } = require('../services/cartRecoveryService');

const execute = async () => {
  console.log('Starting cart recovery job');
  const summary = await runCartRecovery();
  console.log('Cart recovery job finished', summary);
};

execute().catch((err) => {
  console.error('Cart recovery job failed', err);
  process.exit(1);
});
