const socket = io();

const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});

let token = params.token;

socket.emit('register', token);