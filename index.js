/**
 * 服务器
 */
var express = require('express');
var expressWs = require('express-ws');
var app = express();
expressWs(app)
app.use(express.static('public'));
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})
app.ws('/single', SingleRTCConnect)
let rooms = {}
//核心代码
function SingleRTCConnect(ws, req) {
    //获取name
    let url = req.url.split("?")[1];
    let params = new URLSearchParams(url)
    let room = params.get("room")
    rooms[room] = ws
    ws.on('message', async (Resp_data) => {
        let message = JSON.parse(Resp_data)
        let msg
        if (!rooms[message.receiver]) {
            return
        }
        switch (message.name) {
            //创建房间
            case 'createRoom':
                //发送邀请
                msg = {
                    name: "peer",
                    receiver: room
                }
                rooms[message.receiver].send(JSON.stringify(msg))
                break;
            //被邀请方接收
            case 'offer':
                //发送offer
                msg = {
                    name: "offer",
                    receiver: room,
                    data: message.data
                }
                rooms[message.receiver].send(JSON.stringify(msg))
                break;
            //接收answer
            case 'answer':
                //接收answer
                msg = {
                    name: "answer",
                    receiver: room,
                    data: message.data
                }
                rooms[message.receiver].send(JSON.stringify(msg))
                break
            case 'ice_candidate':
                //接收answer
                msg = {
                    name: "ice_candidate",
                    receiver: room,
                    data: message.data,
                }
                rooms[message.receiver].send(JSON.stringify(msg))
                break
        }
    })
    ws.on('close', () => {
        rooms[room] = ""
    })
}
/**
 * 下面的代码基本上不用去看和分析,都是常规配置
 */
/**
 * 读取https证书文件
 */
let fs = require("fs");
const path = require('path');
const httpsOption = {
    key: fs.readFileSync(path.join(__dirname, 'mkcert/server.key')),
    cert: fs.readFileSync(path.join(__dirname, '/mkcert/server.crt'))
}
/**
 * 初始化https
 */
let server = require("https").createServer(httpsOption, app);
/**
 * 设置最大传输文件大小
 */
expressWs(app, server, { wsOptions: { maxPayload: 5 * 1024 * 1024 * 1024, } })
//启动服务
server.listen("3000", "0.0.0.0", function () {
    console.log(`https running at https://127.0.0.1:3000`);
});