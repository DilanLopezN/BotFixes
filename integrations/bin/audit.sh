#!/bin/bash
red=`tput setaf 1`
reset=`tput sgr0`

npm audit --parseable | grep -e 'high' -e 'critical'

if [[ $? -eq 0 ]] ; then
  echo "vulnerabilities found: ${red}high or critical${reset}"
  exit 1  
fi
