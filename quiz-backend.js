const WebSocket = require('ws');
const User = require('./user');

const activeParticipants = [];

function init_quiz_backend(server) {
    const wss = new WebSocket.Server({server});
    wss.on('connection', function(ws) {
        const participant = new Participant(ws);
        activeParticipants.push(participant);
        participant.onConnect();
        ws.on('error', (err) => participant.onError(err));
        ws.on('close', () => participant.onDisconnect());
        ws.on('message', (msg) => participant.onMessage(msg));
    });
}

class Participant {
    constructor(socket) {
        this.socket = socket;
        this.username = null;
        this.user = null;
    }

    onConnect() {
        console.log('Participant connected.');
    }

    onError(err) {
        console.log('Participant error: ' + err);
    }

    onDisconnect() {
        const index = activeParticipants.indexOf(this);
        activeParticipants.splice(index, 1);
        console.log(`Participant ${this.username} disconnected.`);
    }

    onMessage(message) {
        console.log(message);

        let inputData;
        try { inputData = JSON.parse(message); }
        catch(e) {
            console.warn("Unable to parse input data: " + message);
            return;
        }

        switch(inputData.action) {
            case "PAGE_NEXT":
                if (this.username == "admin") {
                    this.onNextPage();
                }
                break;
            
            case "PAGE_PREV":
                if (this.username == "admin") {
                    this.onPrevPage();
                }
                break;

            case "LOGIN":
                this.username = inputData.username;
                // TODO this is big security flaw.
                User.login(this.username, (success, user) => {
                    if (success) {
                        this.user = user;
                    }
                })

        }

    }

    onNextPage() {
        console.log('Moving to next page...');
        this.sendToAll({
            action: 'PAGE_NEXT'
        });
    }

    onPrevPage() {
        console.log('Moving to previous page...');
        this.sendToAll({
            action: 'PAGE_PREV'
        });
    }

    sendToAll(packet) {
        const packetString = JSON.stringify(packet);
        activeParticipants.forEach(p => {
            p.socket.send(packetString);
        });
    }

}

module.exports = init_quiz_backend;