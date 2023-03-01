const socket = io();

socket.on('new-token', (args) => {
    console.log(args);
});