const socket = io();

socket.on('new-token', (args) => {
    console.log(args);
});

socket.on('redirect', (args) => {
    //console.log(args.url);
    args.url ? window.location.href = args.url : console.log(`An error occured: Redirect instruction without url.`);
});