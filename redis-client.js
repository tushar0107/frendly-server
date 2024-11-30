import { createClient } from 'redis';

const client = createClient({
    password: 'o1zS1VhSY2mr4uzRLrnQX9FzuA1uiasv',
    socket: {
        host: 'redis-16894.c330.asia-south1-1.gce.redns.redis-cloud.com',
        port: 16894
    }
});

export default client;