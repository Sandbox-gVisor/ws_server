package main

import (
	"context"
	"fmt"
	socketio "github.com/googollee/go-socket.io"
	_ "github.com/gorilla/mux"
	_ "github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
	"log"
	"net/http"
	"os"
)

var ctx = context.Background()

func main() {
	log.Println("Started ws_server!")

	redisClient := redis.NewClient(&redis.Options{
		Addr: os.Getenv("REDIS_ADDR"),
	})

	if err := redisClient.Ping(ctx).Err(); err != nil {
		log.Fatal("Couldn't connect to redis client: ", err)
	} else {
		log.Println("Successfully connected to Redis client!")
	}

	server := socketio.NewServer(nil)
	controller := NewController(*redisClient, 10)

	server.OnConnect("/", func(s socketio.Conn) error {
		controller.GetLength()
		log.Println(controller.PageSize, controller.CurrentLen)
		controller.Pull()
		controller.EmitData(s)

		return nil
	})

	server.OnEvent("/", "filter", func(s socketio.Conn, data FilterDto) {
		controller.SetFilter(data)
		controller.EmitData(s)
	})

	server.OnEvent("/", "set_page", func(s socketio.Conn, data int) {
		controller.SetPageIndex(data)
		controller.EmitData(s)
	})

	server.OnEvent("/", "set_size", func(s socketio.Conn, data int) {
		controller.SetPageSize(data)
		controller.EmitData(s)
	})

	server.OnDisconnect("disconnect", func(s socketio.Conn, reason string) {
		controller.Filter.Applied = false
		log.Println("Socket " + s.ID() + " disconnected!")
	})

	go func() {
		subscriber := redisClient.Subscribe(ctx, "update")
		defer subscriber.Close()

		for {
			_, err := subscriber.ReceiveMessage(ctx)
			if err != nil {
				log.Printf("Error receiving message: %v\n", err)
				continue
			}

			controller.GetLength()
			server.ForEach("/", "", func(conn socketio.Conn) {
				controller.EmitLen(conn)
				controller.EmitData(conn)
			})
		}
	}()

	// maybe first parameter should contain should be smth
	http.Handle("/", server)

	fmt.Println("Server is listening on port 3001")
	if err := http.ListenAndServe(":3001", nil); err != nil {
		log.Fatal(err)
	}
}
