package main

import (
	_ "github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	_ "github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{}

func main() {
	var client Redis
	client.Init()

}
