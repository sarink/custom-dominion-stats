#!bin/bash

grep 'sarink node /var/www/custom-dominion-stats/server/fetchAndSaveRelevantGameLogs.js' /etc/crontab || echo '0 0 * * * sarink node /var/www/custom-dominion-stats/server/fetchAndSaveRelevantGameLogs.js' >> /etc/crontab
