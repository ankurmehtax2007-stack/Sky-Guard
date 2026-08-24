const clients = new Set();

export const addClient = (ws) => {
    clients.add(ws);
};

export const removeClient = (ws) => {
    clients.delete(ws);
};

export const broadcast = (message) => {

    for (const client of clients) {

        if (client.readyState === 1) {
            client.send(JSON.stringify(message));
        }

    }
};