## TODO

+ 断点续传。服务器支持range参数，可以实现。还需要文件来记录总长度和已经下载长度。
+ 音视频合并。使用ffmpeg
+ 进度显示。
+ 卡主的时候，自动重试

```
ffmpeg -i video.mp4 -i audio.mp4 -c copy output.mp4
```