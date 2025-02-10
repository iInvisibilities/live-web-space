"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ws_1 = require("ws");
var process_1 = __importDefault(require("process"));
var SECRET_BRIDGE_KEY = process_1.default.env.SECRET_BRIDGE_KEY;
if (SECRET_BRIDGE_KEY == undefined) {
    console.log('how are you doing :)');
    process_1.default.exit();
}
var wss = new ws_1.WebSocketServer({ port: 3000 });
var admin_socket = null;
var viewers = new Map();
wss.on('connection', function (socket, request) { return __awaiter(void 0, void 0, void 0, function () {
    var auth_string, session_id, joinAttemptEvent;
    var _a, _b, _c, _d;
    return __generator(this, function (_e) {
        if (((_a = request.url) !== null && _a !== void 0 ? _a : '') == '/admin') {
            if (admin_socket != null) {
                console.log('An admin is already connected!, skipping through this connection.');
                return [2 /*return*/];
            }
            auth_string = (_b = request.headers['sec-websocket-protocol']) !== null && _b !== void 0 ? _b : '';
            if (auth_string == '') {
                socket.close(1003, 'Are you my sweet sveltekit server?!??');
                return [2 /*return*/];
            }
            if (auth_string != SECRET_BRIDGE_KEY) {
                socket.close(1003, 'You are not my sweet little sveltekit server hush hush!');
                return [2 /*return*/];
            }
            admin_socket = socket;
            socket.on('message', function (data) { return admin_sent_command(data); });
            socket.on('close', function () {
                console.log('Admin left, closing system...');
                wss.close();
                process_1.default.exit();
            });
            console.log('Admin joined, system should now be up and running!');
            return [2 /*return*/];
        }
        if (admin_socket == null) {
            socket.close(1002, "Mr. admin didn't connect yet please wait for the server to fully open!");
            return [2 /*return*/];
        }
        session_id = ((_c = request.url) !== null && _c !== void 0 ? _c : '/').substring(1);
        if (session_id == '') {
            socket.close(1003, 'No session id provided!');
            return [2 /*return*/];
        }
        joinAttemptEvent = {
            event_type: 'USER_JOIN_ATTEMPT',
            viewer_ip: (_d = request.socket.remoteAddress) !== null && _d !== void 0 ? _d : '',
            session_id: session_id
        };
        admin_socket.send(Buffer.from(JSON.stringify(joinAttemptEvent)));
        socket.on('close', function () {
            var _a;
            var leaveAttemptEvent = {
                event_type: 'USER_LEAVE_ATTEMPT',
                viewer_ip: (_a = request.socket.remoteAddress) !== null && _a !== void 0 ? _a : '',
                session_id: session_id
            };
            if (admin_socket != null) {
                admin_socket.send(Buffer.from(JSON.stringify(leaveAttemptEvent)));
            }
        });
        socket.on('message', function (data) {
            var _a;
            var interaction_data = JSON.parse(data.toString())['interaction_data'];
            if (interaction_data == undefined) {
                socket.close(undefined, 'naughty');
                return;
            }
            var userInteractEvent = {
                event_type: 'USER_INTERACT_ATTEMPT',
                viewer_ip: (_a = request.socket.remoteAddress) !== null && _a !== void 0 ? _a : '',
                session_id: session_id,
                interaction_data: interaction_data
            };
            if (admin_socket != null) {
                admin_socket.send(Buffer.from(JSON.stringify(userInteractEvent)));
            }
        });
        return [2 /*return*/];
    });
}); });
var admin_sent_command = function (data) {
    var admin_command;
    try {
        admin_command = JSON.parse(data.toString());
    }
    catch (error) {
        admin_socket === null || admin_socket === void 0 ? void 0 : admin_socket.send('Unvalid JSON!');
        return;
    }
    if (admin_command['event_type'] == undefined)
        return;
    var viewer_ip = admin_command['viewer_ip'];
    var viewer_socket_conn = viewers.get(viewer_ip);
    if (viewer_socket_conn == undefined)
        return;
    switch (admin_command['event_type']) {
        case 'KICK_VIEWER_EVENT':
            viewer_socket_conn.send(Buffer.from(JSON.stringify({
                event_type: 'NOTIFICATION',
                notification_message: 'You got kicked.'
            })));
            viewer_socket_conn.close();
            viewers.delete(viewer_ip);
            break;
        case 'UPDATE_VIEW':
            viewer_socket_conn.send(Buffer.from(JSON.stringify({
                event_type: 'UPDATE_VIEW',
                view_update_meta: admin_command['view_update_meta']
            })));
            break;
        case 'NOTIFICATION':
            viewer_socket_conn.send(Buffer.from(JSON.stringify({
                event_type: 'NOTIFICATION',
                notification_message: admin_command['notification_message']
            })));
    }
};
