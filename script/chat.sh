#!/bin/bash
process_name="qyserver.js"
phome=$PWD/wechat_with_bot
log_path=$PWD/logs

check_directory() {
  if [ ! -d "$1" ]; then
    mkdir -p "$1"
    echo "Created directory: $1"
#   else
   # echo "Directory already exists: $1"
  fi
}

check_directory $log_path

cd $phome
start() {
  nohup proxychains npm run qy >> ${log_path}/chat.log  2>&1 &
  echo "Server start successfully."
}
stop() {
  pid=`ps -aux |grep ${process_name} | grep -v grep | awk '{print $2}'`
 if [ $pid ]
 then
  echo "Old server killed."
  kill -9 $pid
 else
  echo "No server started before."
 fi
}

restart() {
 stop
 start
}

update() {
  cd $phome
  git pull
}

go() {
  update
  stop
  start
}

case "$1" in
 start)
  start
  ;;
 stop)
  stop
  ;;
 restart)
  restart
  ;;
 go)
  go
  ;;
 *)
  echo $"Usage: $0 {start|stop|restart|go}"
 ;;
esac