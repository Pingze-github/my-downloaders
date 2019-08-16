
/**
 * bilibili.com 视频下载
 * 音视频分离
 * 可以指定range，确定下载部分。但需要知道结束位置
 */


const request = require('request-promise');
const requestOrigin = require('request');
const fs = require('fs');

const requester = request.defaults({
  headers: {
    'Referer': 'https://www.bilibili.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7',
    'Sec-Fetch-Site': 'none',
    'Connection':'keep-alive',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache'
  },
  rejectUnauthorized: false,
  gzip: true,
  // 通过Fiddler
  // proxy: 'http://127.0.0.1:8888',
})

async function getPlayInfo(url) {
  const text = await requester({url, 
  });
  const results = text.match(/(__playinfo__.+?)<\/script>/m)
  const code = results[1];
  const playInfo = (() => {
    eval(code);
    return __playinfo__;
  })();
  return playInfo;
}

async function test() {
  // 资源数据就在首页中
  // TODO 找到长度

  // request({
  //   uri: 'http://cn-zjjh5-dx-v-10.acgvideo.com/upgcxcode/71/22/108372271/108372271-1-30112.m4s?expires=1565878200&platform=pc&ssig=5L3QopnGkBezJqEsuBDFYQ&oi=2033983822&trid=2263c862f1f741bc9d243e887bb382f6u&nfc=1&nfb=maPYqpoel5MI3qOUX6YpRA==&mid=1407546',
  //   headers: {
  //     'Referer': 'https://www.bilibili.com/video/av7232448',
  //     //'Range': 'bytes=0-21675485'
  //   }
  // })
  //   .pipe(fs.createWriteStream('./test1.mp4'))

  const playInfo = await getPlayInfo('https://www.bilibili.com/video/av61135440?from=search&seid=17698063306247754744');
  console.log(playInfo.data.dash.video[0]);
  console.log(playInfo.data.dash.audio[0]);

  const stream = fs.createWriteStream('./video.mp4', {flags: 'w'});
  // stream.on('pipe', (src) => {
  //   console.log('src', src);
  // });
  stream.on('finish', () => {
    console.log('finish');
  });
  const req = requester({
    uri: playInfo.data.dash.video[0].baseUrl,
    headers: {
      // 'Range': 'bytes=0-767798',
      // 'Range': 'bytes=767799-2303394',
    }
  });
  
  req.on('response', (data) => {
    // 在这里获取到总文件size
    totalBytes = parseInt(data.headers['content-length'], 10);
    console.log('Response', totalBytes);
  });

  let receivedBytes = 0;
  req.on('data', (chunk) => {
    // 更新下载的文件块字节大小
    receivedBytes += chunk.length;
    console.log('progress', receivedBytes, totalBytes);
  });

  req.on('end', () => {
    console.log('下载已完成，等待处理');
    // TODO: 检查文件，部署文件，删除文件
    console.log('finished');
  });

  req.pipe(stream);
}

function readFileSize() {
  const stat = fs.statSync('audio.mp4')
  console.log(stat);
  // 文件的size属性，和下载的size对应
}

function main() {
  test();
  // readFileSize();
}
main();

