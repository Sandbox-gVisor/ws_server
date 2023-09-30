package main

import (
	"github.com/gorilla/mux"
	_ "github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	_ "github.com/gorilla/websocket"
	"log"
	"net/http"
)

var upgrader = websocket.Upgrader{}

func main() {
	var client Redis
	client.Init()

	router := mux.NewRouter()
	router.HandleFunc("/ws", func(writer http.ResponseWriter, request *http.Request) {
		conn, err := upgrader.Upgrade(writer, request, nil)
		if err != nil {
			log.Printf("Failed to upgrade connection to WebSocket: %v", err)
			return
		}

		defer conn.Close()
	})
}
