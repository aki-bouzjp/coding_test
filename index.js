const { XMLHttpRequest } = require('xmlhttprequest');

const commander = require('commander');
commander.option('--s <type>')
  .option('--e <type>');
commander.parse();

const getData = (start, end) => {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('GET', `https://tsserv.tinkermode.dev/data?begin=${start}&end=${end}`, true);
    request.onload = () => {
      if (request.status === 200) {
        resolve(request.responseText);
      } else {
        const error = new Error(request.responseText);
        console.error(error);
        reject(error);
      }
    };
    request.onerror = (error) => {
      console.error(error);
      reject(error);
    };
    request.send();
  });
};

const main = async (start, end) => {
  const data = await getData(start, end);
  const bucket = {};
  for (const row of data.split(/\n/)) {
    const match = row.match(/([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z)(\ ){1,2}(\d+(?:\.\d+)?)/);
    if (!match || match.length < 3) { continue; }
    const datetimeStr = match[1];
    const value = match[3];
    const bucketMatch = row.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}/);
    const bucketKey = bucketMatch[0];
    if (bucketKey in bucket) {
      bucket[bucketKey] = {
        count: bucket[bucketKey].count + 1,
        totalValue: bucket[bucketKey].totalValue + Number(value),
      };
    } else {
      bucket[bucketKey] = {
        count: 1,
        totalValue: Number(value),
      };
    }
  }
  for (const key of Object.keys(bucket)) {
    const { count, totalValue } = bucket[key];
    const averageValue = (Math.round(totalValue / count * 10000) / 10000).toFixed(4);
    console.log(`${key}:00:00Z ${[...Array(8 - String(averageValue).length)].map(() => ' ')}${averageValue}`);
  }
};

const options = commander.opts();
const { s, e } = options;
const startMatch = s.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}/);
const endMatch   = e.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}/);
const start      = `${startMatch}:00:00Z`;
const end        = `${endMatch}:59:59Z`;
main(start, end);
