const res_panel = document.getElementById('result');

async function start_onsale() {
    try {
        const res = axios({
            method: 'post',
            url: 'http://localhost:1234/api/start-onsale'
        });

        res_panel.innerHTML = "Onsale started successfully!";
    } catch(e) {
        res_panel.innerHTML = "!! An error occurred starting the onsale !!";
    }
}