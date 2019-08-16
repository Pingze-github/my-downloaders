
const {exec} = require('child_process');
const fs = require('fs');

const requester = require('./requester');
const Downloader = require('./Downloader');

class BliVideo {
  constructor(indexUrl) {
    this.indexUrl = indexUrl;
    this.avid = this.parseAVid();
  }

  parseAVid() {
    const results = this.indexUrl.match(/av\d+/);
    return results[0];
  }

  parsePlayInfo(text) {
    const results = text.match(/(__playinfo__.+?)<\/script>/m)
    const code = results[1];
    return (() => {
      let __playinfo__ = {};
      eval(code);
      return __playinfo__;
    })();
  }

  parseBaseInfo(text) {
    const results = text.match(/(__INITIAL_STATE__.+?)<\/script>/m)
    const code = results[1];
    return (() => {
      let __INITIAL_STATE__ = {};
      try {
        eval(code);
      } catch {}
      return __INITIAL_STATE__;
    })();    
  }

  async fetchInfo() {
    if (this.info) {
      return this.info;
    }
    const text = await requester(this.indexUrl);
    const playInfo = this.parsePlayInfo(text);
    const baseInfo = this.parseBaseInfo(text);
    this.info = { playInfo, baseInfo };
    return this.info;
  }

  async download(fpath) {
    const videoTempPath = fpath + '.video';
    const audioTempPath = fpath + '.audio';
    const videoDownloader = new Downloader(this.info.playInfo.data.dash.video[0].baseUrl, videoTempPath, true);
    const audioDownloader = new Downloader(this.info.playInfo.data.dash.audio[0].baseUrl, audioTempPath);
    await Promise.all([
      videoDownloader.download(),
      audioDownloader.download(),
    ]);
    console.info('音视频下载完成');
    const cmd = `ffmpeg -i ${videoTempPath} -i ${audioTempPath} -c copy -y ${fpath}`
    await new Promise((resolve, reject) => {
      exec(cmd, (err, stdout, stderr) => {
        if (err) return reject(err);
        resolve();
      })
    });
    console.log('合并完成');
    fs.unlinkSync(audioTempPath);
    fs.unlinkSync(videoTempPath);
  }
}

if (!module.parent){
  process.on('unhandledRejection', rej => { console.error(rej) });
  ~async function () {
    console.log('我是程序入口');

    const av = new BliVideo('https://www.bilibili.com/video/av53982521?from=search&seid=11991029095238972896');
    
    console.log(av.avid);
    
    const info = await av.fetchInfo();

    console.log(info.playInfo.data.accept_description);
    console.log('视频源数', info.playInfo.data.dash.video.length, '音频源数', info.playInfo.data.dash.audio.length);
    console.log(info.playInfo.data.dash.video.map(v => ({ width: `${v.width}x${v.height}`, bandwidth: v.bandwidth})))
    console.log(info.baseInfo.videoData.aid, info.baseInfo.videoData.title);

    // await av.download(av.avid + '.mp4');
    // console.log('video任务完成');
  }()
}