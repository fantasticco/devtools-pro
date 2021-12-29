const {nanoid} = require('nanoid');
const colorette = require('colorette');
const debug = require('../utils/createDebug')('websocket');
const Channel = require('./Channel');
const {getColorfulName} = require('../utils');

module.exports = class HomeChannel {
    constructor(wssInstance) {
        this.wssInstance = wssInstance;
        this.heartBeatsWs = [];
        this._channels = [];
        this._addListeners();
    }
    createChannel(ws, id = nanoid()) {
        const channel = new Channel(ws);
        debug(`${getColorfulName('manager')} ${id} ${colorette.green('connected')}`);
        const channelData = {
            id,
            channel
        };
        this._channels.push(channelData);

        channel.on('close', () => this.removeChannel(id));
    }

    _addListeners() {
        const channelManager = this.wssInstance.getChannelManager();
        // TODO update
        channelManager.on('backendUpdate', data => {
            this.send({event: 'backendUpdate', payload: data});
        });
        channelManager.on('backendConnected', data => {
            this.send({event: 'backendConnected', payload: data});
        });
        channelManager.on('backendDisconnected', data => {
            this.send({event: 'backendDisconnected', payload: data});
        });
        channelManager.on('updateFoxyInfo', data => {
            this.send({event: 'updateFoxyInfo', payload: data});
        });
    }
    removeChannel(id) {
        debug(`${getColorfulName('manager')} ${id} ${colorette.red('disconnected')}`);
        const idx = this._channels.findIndex(c => c.id === id);
        this._channels.splice(idx, 1);
    }
    // 广播事件
    send(message) {
        this._channels.forEach(c => c.channel.send(message));
    }
    destroy() {
        this._channels.forEach(c => c.channel.destroy());
        this._channels.length = 0;
    }
};
