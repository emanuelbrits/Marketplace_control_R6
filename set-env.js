const fs = require('fs');
const dotenv = require('dotenv');

// Carregue o arquivo .env
const envConfig = dotenv.config().parsed;

// Crie um arquivo environment.ts com as variáveis do .env
const content = `
  export const environment = {
    production: false,
    ${Object.keys(envConfig)
      .map((key) => `${key}: '${envConfig[key]}'`)
      .join(',\n')}
  };
`;

fs.writeFileSync('./src/environments/environment.ts', content);
