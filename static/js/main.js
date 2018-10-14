const request = (method, url) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const processRequest = () => {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (err) {
                        reject(new Error(`Unable to parse response from the endpoint: ${url}. ${err}`));
                    }
                } else if (xhr.status === 401) {
                    window.location.reload(true);
                    reject(new Error('A user is not authenticated.'));
                } else {
                    reject(new Error(`A ${method} Request to ${url} failed with status code ${xhr.status}`));
                }
            }
        };
        xhr.open(method, url, true);
        xhr.addEventListener('readystatechange', processRequest, false);
        xhr.send();
    });
};

request('GET', '/api/principal').then(value => {
    document.getElementById('menu-label').innerHTML = value.name;
}).catch(error => {
    console.error(error);
});

document.getElementById('open-button').addEventListener('click', () => {
    request('POST', '/api/gate/open').then(() => {
        alert('Welcome to the Jungle!')
    }).catch(error => {
        alert(`Sorry, cannot open the gate.\n${error}`);
    });
});