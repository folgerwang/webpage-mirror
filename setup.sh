#!/bin/bash
port_idx=3000

sudo npm install express mysql2 nodemailer cors

# Check if server.js is running
if pgrep "node server.js" > /dev/null
then
    echo "server.js is running"
else
    if lsof -Pi :$port_idx -sTCP:LISTEN -t > /dev/null
    then
        echo "Port "$port_idx" is being used"
    else
        echo "run server.js as background"
        node login/server.js
    fi
fi

echo "the end"