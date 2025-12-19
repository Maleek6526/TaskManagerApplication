import 'dotenv/config';

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error('Missing DATABASE_URL in environment');
}

export default {
  datasource: {
    url,
  },
};
