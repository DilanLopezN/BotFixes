cd /var/www

# Start application
export START_TYPE="$1" && node --max-old-space-size=8192 main.js

tail -f /dev/null