cd /var/www
export START_TYPE="$1" && node main.js
tail -f /dev/null