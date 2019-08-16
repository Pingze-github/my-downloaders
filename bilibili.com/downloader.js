
const fs = require('fs');
const requester = require('./requester');

class Downloader {
  constructor(url, fpath, showProgress=false) {
    this.url = url;
    this.fpath = fpath;
    this.totalBytes = 0;
    this.receivedBytes = 0;
    this.progress = 0;
    this.showProgress = showProgress;
  }
  
  download() {
    return new Promise((resolve, reject) => {
      let timer = null;
      if (this.showProgress) {
        timer = setInterval(() => {
          console.log(this.progress);
        }, 1000);
      }
      const stream = fs.createWriteStream(this.fpath, { flags: 'w' });
      stream.on('finish', () => {
        if (timer) clearInterval(timer);
        resolve();
      });

      const req = requester({
        uri: this.url,
        headers: {
          // 'Range': 'bytes=0-767798',
        }
      });

      req.on('response', (data) => {
        // 在这里获取到总文件size
        this.totalBytes = parseInt(data.headers['content-length'], 10);
        // console.log('content-length', this.totalBytes);
      });

      req.on('data', (chunk) => {
        // chunk大小自行确定s
        this.receivedBytes += chunk.length;
        this.progress = this.receivedBytes / this.totalBytes;
        // console.log('progress', this.progress);
      });

      req.on('end', () => {
        // resolve();
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.pipe(stream);
    });
  }
}

module.exports = Downloader;